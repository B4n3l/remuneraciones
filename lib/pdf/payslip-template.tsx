import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: "Helvetica",
    },
    header: {
        marginBottom: 20,
        borderBottom: "2 solid #000",
        paddingBottom: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        textAlign: "center",
        marginBottom: 10,
    },
    companyInfo: {
        marginBottom: 10,
    },
    companyName: {
        fontSize: 12,
        fontWeight: "bold",
    },
    workerSection: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: "#f5f5f5",
    },
    workerName: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 5,
    },
    row: {
        flexDirection: "row",
        marginBottom: 3,
    },
    label: {
        width: "40%",
    },
    value: {
        width: "60%",
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        marginBottom: 8,
        backgroundColor: "#e0e0e0",
        padding: 5,
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
        paddingHorizontal: 5,
    },
    itemLabel: {
        flex: 1,
    },
    itemValue: {
        width: 100,
        textAlign: "right",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 5,
        paddingTop: 5,
        borderTop: "1 solid #000",
        fontWeight: "bold",
    },
    liquidoSection: {
        marginTop: 20,
        padding: 15,
        backgroundColor: "#d4edda",
        borderRadius: 5,
    },
    liquidoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    liquidoLabel: {
        fontSize: 14,
        fontWeight: "bold",
    },
    liquidoValue: {
        fontSize: 18,
        fontWeight: "bold",
    },
    footer: {
        marginTop: 30,
        paddingTop: 20,
        borderTop: "1 solid #ccc",
    },
    signatureSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 40,
    },
    signatureBox: {
        width: "40%",
        textAlign: "center",
    },
    signatureLine: {
        borderTop: "1 solid #000",
        marginTop: 40,
        paddingTop: 5,
    },
});

interface PayslipData {
    company: {
        razonSocial: string;
        rut: string;
        direccion?: string;
    };
    worker: {
        nombres: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
        rut: string;
        cargo: string;
    };
    period: string;
    earnings: Array<{ concepto: string; monto: number }>;
    deductions: Array<{ concepto: string; monto: number }>;
    totalHaberes: number;
    totalDescuentos: number;
    liquido: number;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
    }).format(value);
}

export function PayslipPDF({ data }: { data: PayslipData }) {
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>LIQUIDACIÓN DE SUELDO</Text>
                    <Text style={styles.subtitle}>{data.period}</Text>
                </View>

                {/* Company Info */}
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{data.company.razonSocial}</Text>
                    <Text>RUT: {data.company.rut}</Text>
                    {data.company.direccion && <Text>{data.company.direccion}</Text>}
                </View>

                {/* Worker Section */}
                <View style={styles.workerSection}>
                    <Text style={styles.workerName}>
                        {data.worker.nombres} {data.worker.apellidoPaterno} {data.worker.apellidoMaterno}
                    </Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>RUT:</Text>
                        <Text style={styles.value}>{data.worker.rut}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Cargo:</Text>
                        <Text style={styles.value}>{data.worker.cargo}</Text>
                    </View>
                </View>

                {/* Earnings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>HABERES</Text>
                    {data.earnings.map((item, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemLabel}>{item.concepto}</Text>
                            <Text style={styles.itemValue}>{formatCurrency(item.monto)}</Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text>TOTAL HABERES</Text>
                        <Text style={styles.itemValue}>{formatCurrency(data.totalHaberes)}</Text>
                    </View>
                </View>

                {/* Deductions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DESCUENTOS</Text>
                    {data.deductions.map((item, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemLabel}>{item.concepto}</Text>
                            <Text style={styles.itemValue}>-{formatCurrency(item.monto)}</Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text>TOTAL DESCUENTOS</Text>
                        <Text style={styles.itemValue}>-{formatCurrency(data.totalDescuentos)}</Text>
                    </View>
                </View>

                {/* Liquido Section */}
                <View style={styles.liquidoSection}>
                    <View style={styles.liquidoRow}>
                        <Text style={styles.liquidoLabel}>LÍQUIDO A PAGAR</Text>
                        <Text style={styles.liquidoValue}>{formatCurrency(data.liquido)}</Text>
                    </View>
                </View>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>Firma Empleador</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>Firma Trabajador</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
