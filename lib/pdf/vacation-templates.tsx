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
        marginBottom: 30,
        textDecoration: "underline",
    },
    section: {
        marginBottom: 20,
    },
    row: {
        flexDirection: "row",
        marginBottom: 8,
    },
    label: {
        width: "30%",
        fontWeight: "bold",
    },
    value: {
        width: "70%",
    },
    content: {
        marginTop: 20,
        textAlign: "justify",
    },
    bold: {
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
    dateContainer: {
        marginTop: 40,
        textAlign: "right",
        fontSize: 10,
    }
});

export interface VacationData {
    companyName: string;
    companyRut: string;
    workerName: string;
    workerRut: string;
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

                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nombre Trabajador:</Text>
                        <Text style={styles.value}>{data.workerName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>RUT Trabajador:</Text>
                        <Text style={styles.value}>{data.workerRut}</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text>
                        Por intermedio del presente documento, se deja constancia que el trabajador(a) individualizado(a) anteriormente,
                        hace uso de su feriado anual legal de acuerdo a lo siguiente:
                    </Text>
                    
                    <View style={{ marginTop: 15, marginLeft: 20 }}>
                        <Text>• Fecha de Inicio: <Text style={styles.bold}>{data.startDate}</Text></Text>
                        <Text>• Fecha de Término: <Text style={styles.bold}>{data.endDate}</Text></Text>
                        <Text>• Total Días Hábiles: <Text style={styles.bold}>{data.totalDays}</Text></Text>
                        <Text>• Fecha de Reintegro: <Text style={styles.bold}>{data.returnDate}</Text></Text>
                    </View>

                    <Text style={{ marginTop: 20 }}>
                        El trabajador declara haber recibido a su entera satisfacción la remuneración correspondiente al período 
                        de vacaciones antes señalado, no teniendo cargo ni reclamo alguno que formular al respecto.
                    </Text>
                </View>

                <View style={styles.dateContainer}>
                    <Text>Santiago, {data.currentDate}</Text>
                </View>

                {/* Signatures */}
                <View style={styles.footer}>
                    <View style={styles.signatureBox}>
                        <Text>Firma Trabajador</Text>
                        <Text style={{ fontSize: 8, marginTop: 4 }}>RUT: {data.workerRut}</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text>Firma Empleador / RRHH</Text>
                        <Text style={{ fontSize: 8, marginTop: 4 }}>{data.companyName}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
