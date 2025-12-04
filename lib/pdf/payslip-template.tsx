import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 25,
        fontSize: 9,
        fontFamily: "Helvetica",
    },
    header: {
        marginBottom: 12,
        borderBottom: "2 solid #000",
        paddingBottom: 8,
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
        marginBottom: 8,
    },
    companyName: {
        fontSize: 11,
        fontWeight: "bold",
    },
    workerSection: {
        marginBottom: 10,
        padding: 8,
        backgroundColor: "#f5f5f5",
    },
    workerName: {
        fontSize: 11,
        fontWeight: "bold",
        marginBottom: 3,
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
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: "bold",
        marginBottom: 5,
        backgroundColor: "#e0e0e0",
        padding: 4,
    },
    subSectionTitle: {
        fontSize: 9,
        fontWeight: "bold",
        marginBottom: 3,
        marginTop: 3,
        color: "#444",
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
    subtotalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 3,
        paddingTop: 3,
        borderTop: "1 dashed #999",
        fontSize: 9,
    },
    liquidoSection: {
        marginTop: 12,
        padding: 10,
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
        marginTop: 25,
    },
    signatureBox: {
        width: "40%",
        textAlign: "center",
    },
    signatureLine: {
        borderTop: "1 solid #000",
        marginTop: 30,
        paddingTop: 4,
    },
    confirmationText: {
        marginTop: 50,
        fontSize: 9,
        textAlign: "center",
        fontStyle: "italic",
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

// Convert number to words in Spanish
function numberToWords(num: number): string {
    const units = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
    const teens = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
    const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
    const hundreds = ["", "cien", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

    if (num === 0) return "cero";
    if (num < 0) return "menos " + numberToWords(-num);

    num = Math.floor(num);

    function convertHundreds(n: number): string {
        if (n === 0) return "";
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 30) {
            if (n === 20) return "veinte";
            return "veinti" + units[n - 20];
        }
        if (n < 100) {
            const ten = Math.floor(n / 10);
            const unit = n % 10;
            return tens[ten] + (unit ? " y " + units[unit] : "");
        }
        const hundred = Math.floor(n / 100);
        const rest = n % 100;
        if (hundred === 1 && rest > 0) return "ciento " + convertHundreds(rest);
        return hundreds[hundred] + (rest ? " " + convertHundreds(rest) : "");
    }

    function convertThousands(n: number): string {
        if (n < 1000) return convertHundreds(n);
        const thousands = Math.floor(n / 1000);
        const rest = n % 1000;
        let result = "";
        if (thousands === 1) {
            result = "mil";
        } else {
            result = convertHundreds(thousands) + " mil";
        }
        if (rest > 0) result += " " + convertHundreds(rest);
        return result;
    }

    function convertMillions(n: number): string {
        if (n < 1000000) return convertThousands(n);
        const millions = Math.floor(n / 1000000);
        const rest = n % 1000000;
        let result = "";
        if (millions === 1) {
            result = "un millón";
        } else {
            result = convertHundreds(millions) + " millones";
        }
        if (rest > 0) result += " " + convertThousands(rest);
        return result;
    }

    return convertMillions(num) + " pesos";
}

// Format RUT with dots and dash (12345678-9 -> 12.345.678-9)
function formatRut(rut: string): string {
    // Clean the RUT first (remove any existing formatting)
    const clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();

    if (clean.length < 2) return rut;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    // Add dots every 3 digits from right to left
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return `${formatted}-${dv}`;
}

// Check if an earning is "imponible" (taxable) based on concept name
function isImponible(concepto: string): boolean {
    const noImponibles = ["Colación", "Movilización", "Viático", "Bono Colación", "Bono Movilización", "Bono Viático", "Bonos Variables"];
    return !noImponibles.some(ni => concepto.includes(ni));
}

export function PayslipPDF({ data }: { data: PayslipData }) {
    // Separate earnings into imponibles and no imponibles
    const haberesImponibles = data.earnings.filter(e => isImponible(e.concepto));
    const haberesNoImponibles = data.earnings.filter(e => !isImponible(e.concepto));

    const totalImponibles = haberesImponibles.reduce((sum, e) => sum + e.monto, 0);
    const totalNoImponibles = haberesNoImponibles.reduce((sum, e) => sum + e.monto, 0);

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
                    <Text>RUT: {formatRut(data.company.rut)}</Text>
                    {data.company.direccion && <Text>{data.company.direccion}</Text>}
                </View>

                {/* Worker Section */}
                <View style={styles.workerSection}>
                    <Text style={styles.workerName}>
                        {data.worker.nombres} {data.worker.apellidoPaterno} {data.worker.apellidoMaterno}
                    </Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>RUT:</Text>
                        <Text style={styles.value}>{formatRut(data.worker.rut)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Cargo:</Text>
                        <Text style={styles.value}>{data.worker.cargo}</Text>
                    </View>
                </View>

                {/* Earnings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>HABERES</Text>

                    {/* Haberes Imponibles */}
                    {haberesImponibles.length > 0 && (
                        <>
                            <Text style={styles.subSectionTitle}>Haberes Imponibles</Text>
                            {haberesImponibles.map((item, idx) => (
                                <View key={idx} style={styles.itemRow}>
                                    <Text style={styles.itemLabel}>{item.concepto}</Text>
                                    <Text style={styles.itemValue}>{formatCurrency(item.monto)}</Text>
                                </View>
                            ))}
                            <View style={styles.subtotalRow}>
                                <Text>Subtotal Imponibles</Text>
                                <Text style={styles.itemValue}>{formatCurrency(totalImponibles)}</Text>
                            </View>
                        </>
                    )}

                    {/* Haberes No Imponibles */}
                    {haberesNoImponibles.length > 0 && (
                        <>
                            <Text style={styles.subSectionTitle}>Haberes No Imponibles</Text>
                            {haberesNoImponibles.map((item, idx) => (
                                <View key={idx} style={styles.itemRow}>
                                    <Text style={styles.itemLabel}>{item.concepto}</Text>
                                    <Text style={styles.itemValue}>{formatCurrency(item.monto)}</Text>
                                </View>
                            ))}
                            <View style={styles.subtotalRow}>
                                <Text>Subtotal No Imponibles</Text>
                                <Text style={styles.itemValue}>{formatCurrency(totalNoImponibles)}</Text>
                            </View>
                        </>
                    )}

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

                {/* Confirmation Text */}
                <Text style={styles.confirmationText}>
                    Recibí conforme la cantidad de {numberToWords(data.liquido)}
                </Text>
            </Page>
        </Document>
    );
}

