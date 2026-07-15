import { prisma } from "@/lib/db";
import { uploadWorkerDocument } from "@/lib/storage";
import { pdf } from "@react-pdf/renderer";
import { IndefinidoContract, PlazoFijoContract, ObraFaenaContract } from "@/lib/pdf/contract-templates";
import { VacationVoucher } from "@/lib/pdf/vacation-templates";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import React from 'react';
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { type } = body; // CONTRATO, VACACIONES, etc.

        const worker = await prisma.worker.findUnique({
            where: { id },
            include: { 
                company: true,
                healthPlan: true
            }
        });

        if (!worker) {
            return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
        }

        if (type === "CONTRATO") {
            // Get the latest contract data from DB or from the request
            const contractData = await prisma.contract.findFirst({
                where: { workerId: id },
                orderBy: { createdAt: 'desc' }
            });

            if (!contractData) {
                return NextResponse.json({ error: "No hay datos de contrato registrados para este trabajador" }, { status: 400 });
            }

            // Prepare data for PDF
            const pdfData = {
                companyName: worker.company.razonSocial,
                companyRut: worker.company.rut,
                companyAddress: worker.company.direccion,
                legalRep: contractData.legalRep || worker.company.legalRep || "Representante Legal",
                legalRepRut: contractData.legalRepRut || worker.company.legalRepRut || "",
                workerName: `${worker.nombres} ${worker.apellidoPaterno} ${worker.apellidoMaterno}`,
                workerRut: worker.rut,
                workerAddress: "Domicilio del Trabajador", // This should be in worker model, but using placeholder for now
                workerNationality: "Chilena", // Placeholder
                type: contractData.type,
                startDate: format(new Date(contractData.startDate), "PPP", { locale: es }),
                endDate: contractData.endDate ? format(new Date(contractData.endDate), "PPP", { locale: es }) : undefined,
                cargo: contractData.cargo,
                jornada: contractData.jornada,
                schedule: contractData.schedule,
                workplace: contractData.workplace,
                baseSalary: Number(contractData.baseSalary),
                benefits: contractData.benefits || undefined,
                obraDetails: contractData.obraDetails || undefined
            };

            // Render PDF to buffer
            let MyDocument;
            if (contractData.type === "INDEFINIDO") MyDocument = IndefinidoContract;
            else if (contractData.type === "PLAZO_FIJO") MyDocument = PlazoFijoContract;
            else MyDocument = ObraFaenaContract;

            const blob = await pdf(<MyDocument data={pdfData as any} />).toBlob();
            const buffer = Buffer.from(await blob.arrayBuffer());

            // Upload to Storage
            const fileName = `contrato_${worker.apellidoPaterno}_${Date.now()}.pdf`;
            const uploadResult = await uploadWorkerDocument(id, buffer, fileName);

            // Save to DB
            const doc = await prisma.documentoTrabajador.create({
                data: {
                    workerId: id,
                    nombre: `Contrato ${contractData.type} - ${format(new Date(), "yyyy-MM-dd")}`,
                    tipo: "CONTRATO",
                    storagePath: uploadResult.path,
                    tamanioBytes: buffer.length,
                    mimeType: "application/pdf"
                }
            });

            return NextResponse.json(doc);
        }

        if (type === "VACACIONES") {
            const { startDate, endDate, totalDays, anioServicio } = body;

            if (!startDate || !endDate || !totalDays || !anioServicio) {
                return NextResponse.json({ error: "Faltan datos de vacaciones (startDate, endDate, totalDays, anioServicio)" }, { status: 400 });
            }

            const fechaRegreso = addDays(new Date(endDate), 1);

            // Prepare data for PDF
            const pdfData = {
                companyName: worker.company.razonSocial,
                companyRut: worker.company.rut,
                workerName: `${worker.nombres} ${worker.apellidoPaterno} ${worker.apellidoMaterno}`,
                workerRut: worker.rut,
                cargo: worker.cargo,
                anioServicio: anioServicio,
                startDate: format(new Date(startDate), "PPP", { locale: es }),
                endDate: format(new Date(endDate), "PPP", { locale: es }),
                totalDays: totalDays,
                returnDate: format(fechaRegreso, "PPP", { locale: es }),
                currentDate: format(new Date(), "PPP", { locale: es })
            };

            const blob = await pdf(<VacationVoucher data={pdfData} />).toBlob();
            const buffer = Buffer.from(await blob.arrayBuffer());

            // Upload to Storage
            const fileName = `vacaciones_${worker.apellidoPaterno}_${Date.now()}.pdf`;
            const uploadResult = await uploadWorkerDocument(id, buffer, fileName);

            // Save to DB
            const doc = await prisma.documentoTrabajador.create({
                data: {
                    workerId: id,
                    nombre: `Vacaciones - ${format(new Date(startDate), "yyyy-MM-dd")}`,
                    tipo: "VACACIONES",
                    storagePath: uploadResult.path,
                    tamanioBytes: buffer.length,
                    mimeType: "application/pdf"
                }
            });

            // Also create a record in Vacacion model
            await prisma.vacacion.create({
                data: {
                    workerId: id,
                    fechaInicio: new Date(startDate),
                    fechaFin: new Date(endDate),
                    diasHabiles: totalDays,
                    anioServicio: anioServicio,
                    fechaRegreso: fechaRegreso,
                    comprobantePath: uploadResult.path
                }
            });

            return NextResponse.json(doc);
        }

        return NextResponse.json({ error: "Tipo de documento no soportado" }, { status: 400 });

    } catch (error: any) {
        console.error("Error generating PDF:", error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
