import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 50,
        fontSize: 11,
        fontFamily: "Helvetica",
        lineHeight: 1.6,
    },
    header: {
        marginBottom: 30,
        borderBottom: "1 solid #eee",
        paddingBottom: 10,
    },
    companyName: {
        fontSize: 12,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    companyRut: {
        fontSize: 10,
        color: "#666",
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 20,
        textDecoration: "underline",
    },
    subtitle: {
        fontSize: 9,
        textAlign: "center",
        color: "#666",
        marginTop: 4,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 12,
    },
    content: {
        textAlign: "justify",
    },
    bold: {
        fontWeight: "bold",
    },
    detailTitle: {
        fontSize: 11,
        fontWeight: "bold",
        marginTop: 25,
        marginBottom: 10,
    },
    row: {
        flexDirection: "row",
        marginBottom: 6,
    },
    label: {
        width: "45%",
    },
    value: {
        width: "55%",
        fontWeight: "bold",
    },
    footer: {
        marginTop: 80,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    signatureBox: {
        width: "45%",
        borderTop: "1 solid #000",
        paddingTop: 8,
        textAlign: "center",
        fontSize: 10,
    },
});

export interface VacationData {
    companyName: string;
    companyRut: string;
    workerName: string;
    workerRut: string;
    cargo: string;
    anioServicio: number;
    startDate: string;
    endDate: string;
    totalDays: number;
    returnDate: string;
    currentDate: string;
}

export function VacationVoucher({ data }: { data: VacationData }) {
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.companyName}>{data.companyName}</Text>
                    <Text style={styles.companyRut}>RUT: {data.companyRut}</Text>
                </View>

                <Text style={styles.title}>COMPROBANTE DE FERIADO LEGAL</Text>
                <Text style={styles.subtitle}>Código del Trabajo de Chile — Art. 67 y 68</Text>

                <Text style={styles.sectionTitle}>Autorización de Feriado</Text>

                <View style={styles.content}>
                    <Text>
                        La empresa <Text style={styles.bold}>{data.companyName}</Text>, RUT <Text style={styles.bold}>{data.companyRut}</Text>, autoriza al trabajador(a) <Text style={styles.bold}>{data.workerName}</Text>, RUT <Text style={styles.bold}>{data.workerRut}</Text>, cargo <Text style={styles.bold}>{data.cargo}</Text>, hacer uso de su feriado legal
                        correspondiente al año de servicio N° <Text style={styles.bold}>{data.anioServicio}</Text>, según lo dispuesto en el artículo 67 del Código del Trabajo.
                    </Text>
                    <Text style={{ marginTop: 10 }}>
                        El feriado comprende <Text style={styles.bold}>{data.totalDays}</Text> día(s) hábil(es), a partir del día <Text style={styles.bold}>{data.startDate}</Text> hasta el día <Text style={styles.bold}>{data.endDate}</Text>
                        {" "}inclusive, debiendo reintegrarse a sus labores el día <Text style={styles.bold}>{data.returnDate}</Text>.
                    </Text>
                </View>

                <Text style={styles.detailTitle}>Detalle</Text>
                <View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha inicio vacaciones:</Text>
                        <Text style={styles.value}>{data.startDate}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha término vacaciones:</Text>
                        <Text style={styles.value}>{data.endDate}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha de reintegro:</Text>
                        <Text style={styles.value}>{data.returnDate}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Días hábiles utilizados:</Text>
                        <Text style={styles.value}>{data.totalDays}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Emisión del comprobante:</Text>
                        <Text style={styles.value}>{data.currentDate}</Text>
                    </View>
                </View>

                <Text style={{ marginTop: 15 }}>
                    Las partes declaran estar de acuerdo con el período de feriado indicado. El trabajador(a) firma en señal de haber recibido este
                    comprobante.
                </Text>

                {/* Signatures */}
                <View style={styles.footer}>
                    <View style={styles.signatureBox}>
                        <Text>RUT: {data.companyRut}</Text>
                        <Text>Empleador</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text>{data.workerName}</Text>
                        <Text>RUT: {data.workerRut}</Text>
                        <Text>Trabajador(a)</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
