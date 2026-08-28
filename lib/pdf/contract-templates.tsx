import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { numeroEnPalabras } from "@/lib/numero-en-palabras";

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 11,
        fontFamily: "Helvetica",
        lineHeight: 1.5,
    },
    title: {
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        textTransform: "uppercase",
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 8,
        textDecoration: "underline",
    },
    clauseTitle: {
        fontSize: 11,
        fontWeight: "bold",
        marginTop: 10,
        marginBottom: 5,
    },
    text: {
        textAlign: "justify",
        marginBottom: 8,
    },
    bold: {
        fontWeight: "bold",
    },
    indented: {
        marginLeft: 20,
        marginBottom: 5,
    },
    signatures: {
        marginTop: 40,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    signatureBox: {
        width: "40%",
    },
    signatureLine: {
        borderTop: "1 solid #000",
        marginTop: 60,
        paddingTop: 5,
        textAlign: "center",
        fontSize: 9,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        color: "#666",
        textAlign: "center",
    },
});

export interface ContractData {
    // Company
    companyName: string;
    companyRut: string;
    companyEmail?: string;
    companyDomicilio: string;
    companyComuna: string;
    legalRep: string;
    legalRepRut: string;

    // Worker (datos personales)
    workerName: string;
    workerRut: string;
    workerEmail?: string;
    workerNacimiento?: string; // fecha de nacimiento formateada
    workerNacionalidad?: string;
    workerEstadoCivil?: string;
    workerProfesion?: string;
    workerDomicilio?: string;
    workerComuna?: string;
    workerCiudad?: string;

    // Contract details
    type: "INDEFINIDO" | "PLAZO_FIJO" | "OBRA_FAENA";
    startDate: string;
    endDate?: string; // Solo para PLAZO_FIJO
    fechaIngreso: string; // fecha de ingreso del trabajador, formateada
    cargo: string;
    jornada: string;
    schedule: string;
    workplace: string;
    comunaTrabajo?: string;
    baseSalary: number;
    sueldoEnPalabras?: string; // si se omite, se calcula con numeroEnPalabras
    benefits?: string;
    obraDetails?: string; // Solo para OBRA_FAENA
    formaPago?: string;
    periodicidad?: string;
    minutosColacion?: number;
    tipoGratificacion?: "PACTADA" | "LEGAL_25";
    gratificacionPactada?: number; // solo si tipoGratificacion === "PACTADA"
}

function formatRut(rut: string): string {
    const clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
    if (clean.length < 2) return rut;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted}-${dv}`;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
    }).format(value);
}

/** Fragmento en negrita dentro del texto del contrato. */
function B({ children }: { children: ReactNode }) {
    return <Text style={styles.bold}>{children}</Text>;
}

/**
 * Template único de contrato de trabajo (10 cláusulas, formato legal chileno).
 * El texto varía según `data.type` en las cláusulas PRIMERO y SÉPTIMO.
 * Los campos opcionales vacíos se omiten elegantemente (sin dejar comas huérfanas).
 */
export function ContractPdf({ data }: { data: ContractData }) {
    const nacionalidad = data.workerNacionalidad || "Chilena";
    const formaPago = data.formaPago || "Transferencia bancaria";
    const periodicidad = data.periodicidad || "Mensualmente";
    const minutosColacion = data.minutosColacion ?? 30;
    const sueldoEnPalabras = data.sueldoEnPalabras || numeroEnPalabras(data.baseSalary);

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <Text style={styles.title}>Contrato de Trabajo</Text>

                {/* Identificación de las partes */}
                <View style={styles.section}>
                    <Text style={styles.text}>
                        En <B>{data.companyComuna}</B>, a <B>{data.startDate}</B>, entre la Empresa <B>{data.companyName}</B>, RUT <B>{formatRut(data.companyRut)}</B>
                        {data.companyEmail && (
                            <>{", correo electrónico "}<B>{data.companyEmail}</B></>
                        )}
                        {", representada por don/doña "}
                        <B>{data.legalRep}</B>
                        {", RUT "}
                        <B>{formatRut(data.legalRepRut)}</B>
                        {", con domicilio en "}
                        <B>{data.companyDomicilio}</B>
                        {", comuna de "}
                        <B>{data.companyComuna}</B>
                        {', en adelante "el empleador", y don/doña '}
                        <B>{data.workerName}</B>
                        {", de nacionalidad "}
                        <B>{nacionalidad}</B>
                        {data.workerNacimiento && (
                            <>{", nacido(a) el "}<B>{data.workerNacimiento}</B></>
                        )}
                        {", cédula de identidad Nº "}
                        <B>{formatRut(data.workerRut)}</B>
                        {data.workerEmail && (
                            <>{", correo electrónico "}<B>{data.workerEmail}</B></>
                        )}
                        {data.workerDomicilio && (
                            <>{", domiciliado(a) en "}<B>{data.workerDomicilio}</B></>
                        )}
                        {data.workerComuna && (
                            <>{", comuna "}<B>{data.workerComuna}</B></>
                        )}
                        {data.workerCiudad && (
                            <>{", de la ciudad de "}<B>{data.workerCiudad}</B></>
                        )}
                        {data.workerProfesion && (
                            <>{", de profesión u oficio "}<B>{data.workerProfesion}</B></>
                        )}
                        {data.workerEstadoCivil && (
                            <>{", de estado civil "}<B>{data.workerEstadoCivil}</B></>
                        )}
                        {', en adelante "el trabajador", se ha convenido el siguiente contrato de trabajo.'}
                    </Text>
                </View>

                {/* PRIMERO: Naturaleza de los servicios */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>PRIMERO</Text>
                    <Text style={styles.text}>
                        El trabajador se compromete y obliga a ejecutar el trabajo de <B>{data.cargo}</B> que se le encomienda.
                        {data.type === "OBRA_FAENA" && (
                            <> para la realización de la obra o faena que se detalla: <B>{data.obraDetails}</B>.</>
                        )}
                    </Text>
                </View>

                {/* SEGUNDO: Lugar de trabajo */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>SEGUNDO</Text>
                    <Text style={styles.text}>
                        Los servicios se prestarán en <B>{data.workplace}</B>
                        {data.comunaTrabajo && (
                            <>{", comuna de "}<B>{data.comunaTrabajo}</B></>
                        )}
                        {", sin perjuicio de la facultad del empleador de alterar, por causa justificada, la naturaleza de los servicios, o el sitio o recinto en que ellos han de prestarse, con la sola limitación de que se trate de labores similares y que el nuevo sitio o recinto quede dentro de la misma localidad o ciudad, conforme a lo señalado en el artículo 12º del Código del Trabajo."}
                    </Text>
                </View>

                {/* TERCERO: Jornada de trabajo */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>TERCERO</Text>
                    <Text style={styles.text}>
                        La jornada de trabajo será <B>{data.jornada}</B>, según el siguiente horario: <B>{data.schedule}</B>, con <B>{minutosColacion}</B> minutos de descanso destinados a colación.
                    </Text>
                </View>

                {/* CUARTO: Remuneración */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>CUARTO</Text>
                    <Text style={styles.text}>
                        El empleador se compromete a remunerar los servicios del trabajador con un sueldo base mensual de <B>{formatCurrency(data.baseSalary)}</B> (<B>{sueldoEnPalabras}</B>) que será liquidado y pagado, mediante <B>{formaPago}</B>, por mes vencido, por períodos vencidos y en forma proporcional a los días trabajados.
                    </Text>
                </View>

                {/* QUINTO: Beneficios, pago y gratificación */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>QUINTO</Text>
                    <Text style={styles.text}>
                        {data.benefits && (
                            <>
                                El empleador se compromete a pagar al trabajador los siguientes beneficios: <B>{data.benefits}</B>.{" "}
                            </>
                        )}
                        Las remuneraciones se pagarán <B>{periodicidad}</B>, por iguales períodos vencidos en moneda nacional, y del monto de ellas el Empleador hará las deducciones previsionales que establecen las leyes vigentes.{" "}
                        {data.tipoGratificacion === "PACTADA" && data.gratificacionPactada ? (
                            <>
                                Además, el Empleador pagará al trabajador una gratificación pactada de <B>{formatCurrency(data.gratificacionPactada)}</B> por mes.
                            </>
                        ) : (
                            <>
                                Además, el Empleador pagará al trabajador una gratificación legal equivalente al 25% de la remuneración mensual, con un tope de 4,75 ingresos mínimos mensuales, conforme a los artículos 47 y 50 del Código del Trabajo.
                            </>
                        )}
                    </Text>
                </View>

                {/* SEXTO: Obligaciones del trabajador */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>SEXTO</Text>
                    <Text style={styles.text}>
                        El trabajador se compromete y obliga expresamente a cumplir las instrucciones que le sean impartidas por su jefe inmediato o por la gerencia de la empresa, en relación a su trabajo, y acatar en todas sus partes las normas del Reglamento Interno de Orden, Higiene y Seguridad (cuando exista en la empresa), las que declara conocer y que forman parte integrante del presente contrato, reglamento del cual se le entrega un ejemplar.
                    </Text>
                </View>

                {/* SÉPTIMO: Duración */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>SÉPTIMO</Text>
                    <Text style={styles.text}>
                        {data.type === "INDEFINIDO" && (
                            <>El presente contrato será indefinido y sólo podrá ponérsele término en conformidad a la legislación vigente.</>
                        )}
                        {data.type === "PLAZO_FIJO" && (
                            <>El presente contrato será a plazo fijo, durará hasta <B>{data.endDate}</B> y sólo podrá ponérsele término en conformidad a la legislación vigente.</>
                        )}
                        {data.type === "OBRA_FAENA" && (
                            <>El presente contrato será por obra o faena determinada, regirá desde <B>{data.startDate}</B> y terminará al concluir la obra o faena, de conformidad a la legislación vigente.</>
                        )}
                    </Text>
                </View>

                {/* OCTAVO: Fecha de ingreso */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>OCTAVO</Text>
                    <Text style={styles.text}>
                        Se deja constancia que el trabajador ingresó al servicio del empleador el <B>{data.fechaIngreso}</B>.
                    </Text>
                </View>

                {/* NOVENO: Domicilio y jurisdicción */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>NOVENO</Text>
                    <Text style={styles.text}>
                        Para todos los efectos derivados del presente contrato las partes fijan domicilio en la ciudad de <B>{data.workerCiudad || data.companyComuna}</B> y se someten a la Jurisdicción de sus Tribunales.
                    </Text>
                </View>

                {/* DÉCIMO: Ejemplares */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>DÉCIMO</Text>
                    <Text style={styles.text}>
                        El presente contrato se firma en 2 ejemplares, declarando el trabajador haber recibido en este acto un ejemplar de dicho instrumento, que es el fiel reflejo de la relación laboral convenida.
                    </Text>
                </View>

                {/* Firmas */}
                <View style={styles.signatures}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>
                            {data.legalRep}{"\n"}
                            RUT {formatRut(data.legalRepRut)}{"\n"}
                            EMPLEADOR
                        </Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>
                            {data.workerName}{"\n"}
                            RUT {formatRut(data.workerRut)}{"\n"}
                            TRABAJADOR
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Contrato sujeto a las disposiciones del Código del Trabajo de Chile
                </Text>
            </Page>
        </Document>
    );
}

// Wrappers por tipo de contrato (compatibilidad con las rutas que importan
// las funciones específicas).
export function IndefinidoContract({ data }: { data: ContractData }) {
    return <ContractPdf data={{ ...data, type: "INDEFINIDO" }} />;
}

export function PlazoFijoContract({ data }: { data: ContractData }) {
    return <ContractPdf data={{ ...data, type: "PLAZO_FIJO" }} />;
}

export function ObraFaenaContract({ data }: { data: ContractData }) {
    return <ContractPdf data={{ ...data, type: "OBRA_FAENA" }} />;
}
