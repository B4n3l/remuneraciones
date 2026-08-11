import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

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

export interface AnexoData {
    companyName: string;
    companyRut: string;
    companyAddress: string;
    legalRep: string;
    legalRepRut: string;

    workerName: string;
    workerRut: string;
    workerAddress: string;
    workerNationality: string;

    originalContractType: string;
    originalStartDate: string;

    cambioCargo?: string;
    nuevoSueldo?: number;
    cambioJornada?: string;
    otros?: string;

    fechaEfectiva: string;
    fechaAnexo: string;
    lugarAnexo: string;
}

export function AnexoContract({ data }: { data: AnexoData }) {
    const hasChanges = data.cambioCargo || data.nuevoSueldo != null || data.cambioJornada || data.otros;

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <Text style={styles.title}>Anexo de Contrato de Trabajo</Text>

                <View style={styles.section}>
                    <Text style={styles.text}>
                        En <Text style={styles.bold}>{data.lugarAnexo}</Text>, a <Text style={styles.bold}>{data.fechaAnexo}</Text>,
                        entre <Text style={styles.bold}>{data.companyName}</Text>, RUT <Text style={styles.bold}>{formatRut(data.companyRut)}</Text>,
                        representada por don(ña) <Text style={styles.bold}>{data.legalRep}</Text>,
                        RUT <Text style={styles.bold}>{formatRut(data.legalRepRut)}</Text>, en adelante "el Empleador",
                        y don(ña) <Text style={styles.bold}>{data.workerName}</Text>,
                        RUT <Text style={styles.bold}>{formatRut(data.workerRut)}</Text>, de nacionalidad <Text style={styles.bold}>{data.workerNationality}</Text>,
                        domiciliado(a) en <Text style={styles.bold}>{data.workerAddress}</Text>, en adelante "el Trabajador",
                        se ha convenido el siguiente anexo al contrato de trabajo:
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>PRIMERA: ANTECEDENTES</Text>
                    <Text style={styles.text}>
                        Las partes celebraron un contrato de trabajo de tipo <Text style={styles.bold}>{data.originalContractType}</Text>,
                        con fecha de inicio el <Text style={styles.bold}>{data.originalStartDate}</Text>,
                        el cual se encuentra vigente y en pleno cumplimiento.
                    </Text>
                    <Text style={styles.text}>
                        Por la presente, las partes acuerdan modificar dicho contrato en los términos que a continuación se indican.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>SEGUNDA: MODIFICACIONES</Text>
                    {!hasChanges && (
                        <Text style={styles.text}>
                            Se deja constancia de que las partes acuerdan las modificaciones descritas en el presente anexo.
                        </Text>
                    )}
                    {data.cambioCargo && (
                        <Text style={styles.text}>
                            <Text style={styles.bold}>Cambio de cargo:</Text> El Trabajador pasará a desempeñar el cargo de{" "}
                            <Text style={styles.bold}>{data.cambioCargo}</Text>.
                        </Text>
                    )}
                    {typeof data.nuevoSueldo === "number" && (
                        <Text style={styles.text}>
                            <Text style={styles.bold}>Modificación de remuneración:</Text> La remuneración mensual del Trabajador
                            será de <Text style={styles.bold}>{formatCurrency(Number(data.nuevoSueldo))}</Text> (pesos chilenos),
                            con los descuentos legales correspondientes.
                        </Text>
                    )}
                    {data.cambioJornada && (
                        <Text style={styles.text}>
                            <Text style={styles.bold}>Cambio de jornada/horario:</Text> La jornada de trabajo será modificada
                            conforme a lo siguiente: <Text style={styles.bold}>{data.cambioJornada}</Text>.
                        </Text>
                    )}
                    {data.otros && (
                        <Text style={styles.text}>
                            <Text style={styles.bold}>Otros:</Text> {data.otros}
                        </Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>TERCERA: VIGENCIA</Text>
                    <Text style={styles.text}>
                        El presente anexo comenzará a regir a partir del <Text style={styles.bold}>{data.fechaEfectiva}</Text>.
                    </Text>
                    <Text style={styles.text}>
                        Excepto por las modificaciones expresamente establecidas en el presente anexo,
                        todas las demás cláusulas del contrato original continúan vigentes y de pleno efecto.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>CUARTA: FIRMAS</Text>
                    <Text style={styles.text}>
                        Las partes firman el presente anexo en señal de conformidad y aceptación de las modificaciones aquí contenidas.
                    </Text>
                </View>

                <View style={styles.signatures}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>
                            {data.legalRep}{"\n"}
                            RUT {formatRut(data.legalRepRut)}{"\n"}
                            Empleador
                        </Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>
                            {data.workerName}{"\n"}
                            RUT {formatRut(data.workerRut)}{"\n"}
                            Trabajador
                        </Text>
                    </View>
                </View>

                <Text style={styles.footer}>
                    Anexo de contrato de trabajo sujeto a las disposiciones del Código del Trabajo de Chile
                </Text>
            </Page>
        </Document>
    );
}
