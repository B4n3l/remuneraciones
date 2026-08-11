import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        paddingTop: 30,
        paddingBottom: 30,
        paddingLeft: 25,
        paddingRight: 25,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#1a1a1a",
    },
    /* ── Header ── */
    header: {
        marginBottom: 12,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    companyName: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        color: "#1a365d",
    },
    companyDetail: {
        fontSize: 9,
        color: "#1a365d",
    },
    headerDivider: {
        borderBottom: "1 solid #333",
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontFamily: "Helvetica-Bold",
        textAlign: "center",
        color: "#1a1a1a",
    },
    period: {
        fontSize: 11,
        textAlign: "center",
        color: "#555",
        marginTop: 2,
        marginBottom: 4,
    },
    /* ── Worker Info ── */
    workerSection: {
        flexDirection: "row",
        backgroundColor: "#F8F9FA",
        padding: 10,
        marginBottom: 12,
    },
    workerLeft: {
        flex: 1,
    },
    workerRight: {
        flex: 1,
        borderLeft: "1 solid #e2e8f0",
        paddingLeft: 12,
    },
    workerName: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        marginBottom: 4,
    },
    workerRow: {
        flexDirection: "row",
        marginBottom: 2,
    },
    workerLabel: {
        width: 65,
        fontSize: 9,
        color: "#555",
    },
    workerValue: {
        flex: 1,
        fontSize: 10,
    },
    workerInfoText: {
        fontSize: 10,
        marginBottom: 2,
    },
    /* ── Side-by-side tables ── */
    tablesContainer: {
        flexDirection: "row",
        marginBottom: 6,
    },
    tableColumn: {
        flex: 1,
    },
    tableColumnRight: {
        flex: 1,
        marginLeft: 12,
    },
    /* ── Section titles ── */
    sectionTitle: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: "#1a365d",
        marginBottom: 6,
        borderBottom: "1 solid #333",
        paddingBottom: 3,
    },
    /* ── Table header ── */
    tableHeaderRow: {
        flexDirection: "row",
        borderBottom: "1 solid #333",
        paddingBottom: 4,
        marginBottom: 2,
    },
    tableHeaderConcept: {
        flex: 1,
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
    },
    tableHeaderAmount: {
        width: 80,
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        textAlign: "right",
    },
    /* ── Data rows ── */
    tableDataRow: {
        flexDirection: "row",
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 2,
        paddingRight: 2,
    },
    tableCellConcept: {
        flex: 1,
        fontSize: 9,
    },
    tableCellAmount: {
        width: 80,
        fontSize: 9,
        textAlign: "right",
    },
    /* ── Sub-section label inside earnings ── */
    subsectionLabel: {
        fontSize: 8,
        fontFamily: "Helvetica-Oblique",
        color: "#888",
        marginTop: 8,
        marginBottom: 2,
        paddingLeft: 2,
        borderTop: "0.5 solid #e2e8f0",
        paddingTop: 4,
    },
    /* ── Column totals ── */
    columnTotalRow: {
        flexDirection: "row",
        borderTop: "0.5 solid #e2e8f0",
        paddingTop: 4,
        marginTop: 6,
        paddingLeft: 2,
        paddingRight: 2,
    },
    columnTotalLabel: {
        flex: 1,
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#555",
    },
    columnTotalAmount: {
        width: 80,
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        textAlign: "right",
        color: "#555",
    },
    /* ── Summary footer ── */
    summarySection: {
        marginTop: 12,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 4,
    },
    summaryLabel: {
        width: 200,
        fontSize: 10,
        textAlign: "right",
        fontFamily: "Helvetica-Bold",
    },
    summaryValue: {
        width: 100,
        fontSize: 10,
        textAlign: "right",
    },
    liquidoRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        borderTop: "1 solid #333",
        paddingTop: 8,
        marginTop: 6,
    },
    liquidoLabel: {
        width: 200,
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        textAlign: "right",
        color: "#1a1a1a",
    },
    liquidoValue: {
        width: 100,
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        textAlign: "right",
        color: "#1a1a1a",
    },
    liquidoInWords: {
        fontSize: 8,
        fontFamily: "Helvetica-Oblique",
        color: "#888",
        textAlign: "right",
        marginTop: 4,
    },
    /* ── Bottom ── */
    bottomSection: {
        marginTop: "auto",
        paddingTop: 30,
    },
    signatureLine: {
        borderTop: "1 solid #333",
        width: "55%",
        marginLeft: "auto",
        marginRight: "auto",
        paddingTop: 6,
    },
    signatureText: {
        textAlign: "center",
        fontSize: 9,
        color: "#555",
    },
    dateRow: {
        textAlign: "right",
        fontSize: 9,
        color: "#555",
        marginTop: 16,
        marginBottom: 8,
    },
    legalFooter: {
        fontSize: 7,
        fontFamily: "Helvetica-Oblique",
        color: "#aaa",
        textAlign: "center",
        borderTop: "0.5 solid #e2e8f0",
        paddingTop: 6,
    },
    pageNumber: {
        fontSize: 8,
        textAlign: "center",
        color: "#aaa",
        marginTop: 6,
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

function formatRut(rut: string): string {
    const clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();

    if (clean.length < 2) return rut;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return `${formatted}-${dv}`;
}

function isImponible(concepto: string): boolean {
    const noImponibles = ["Colación", "Movilización", "Viático", "Bono Colación", "Bono Movilización", "Bono Viático", "Bonos Variables"];
    return !noImponibles.some(ni => concepto.includes(ni));
}

function todayString(): string {
    const d = new Date();
    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

export function PayslipPDF({ data }: { data: PayslipData }) {
    const haberesImponibles = data.earnings.filter(e => isImponible(e.concepto));
    const haberesNoImponibles = data.earnings.filter(e => !isImponible(e.concepto));

    const totalImponibles = haberesImponibles.reduce((sum, e) => sum + e.monto, 0);
    const totalNoImponibles = haberesNoImponibles.reduce((sum, e) => sum + e.monto, 0);

    const fullName = `${data.worker.nombres} ${data.worker.apellidoPaterno} ${data.worker.apellidoMaterno}`;

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Text style={styles.companyName}>{data.company.razonSocial}</Text>
                    </View>
                    <Text style={styles.companyDetail}>
                        RUT {formatRut(data.company.rut)}
                        {data.company.direccion ? `  —  ${data.company.direccion}` : ""}
                    </Text>
                </View>

                <View style={styles.headerDivider} />

                <Text style={styles.title}>LIQUIDACIÓN DE SUELDO</Text>
                <Text style={styles.period}>{data.period}</Text>

                {/* ── Worker Info ── */}
                <View style={styles.workerSection}>
                    <View style={styles.workerLeft}>
                        <Text style={styles.workerName}>{fullName}</Text>
                        <View style={styles.workerRow}>
                            <Text style={styles.workerLabel}>RUT:</Text>
                            <Text style={styles.workerValue}>{formatRut(data.worker.rut)}</Text>
                        </View>
                        <View style={styles.workerRow}>
                            <Text style={styles.workerLabel}>Cargo:</Text>
                            <Text style={styles.workerValue}>{data.worker.cargo}</Text>
                        </View>
                    </View>
                    <View style={styles.workerRight}>
                        <View style={styles.workerRow}>
                            <Text style={styles.workerLabel}>Período:</Text>
                            <Text style={styles.workerValue}>{data.period}</Text>
                        </View>
                        <View style={styles.workerRow}>
                            <Text style={styles.workerLabel}>Emisión:</Text>
                            <Text style={styles.workerValue}>{todayString()}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Tables: Haberes & Descuentos side by side ── */}
                <View style={styles.tablesContainer}>
                    {/* Haberes Column */}
                    <View style={styles.tableColumn}>
                        <Text style={styles.sectionTitle}>HABERES</Text>

                        {/* Table header */}
                        <View style={styles.tableHeaderRow}>
                            <Text style={styles.tableHeaderConcept}>Concepto</Text>
                            <Text style={styles.tableHeaderAmount}>Monto</Text>
                        </View>

                        {/* Imponibles */}
                        {haberesImponibles.map((item, idx) => (
                            <View
                                key={`imp-${idx}`}
                                style={[
                                    styles.tableDataRow,
                                    { backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8F9FA" },
                                ]}
                            >
                                <Text style={styles.tableCellConcept}>{item.concepto}</Text>
                                <Text style={styles.tableCellAmount}>{formatCurrency(item.monto)}</Text>
                            </View>
                        ))}

                        {haberesNoImponibles.length > 0 && (
                            <>
                                <Text style={styles.subsectionLabel}>No imponibles</Text>
                                {haberesNoImponibles.map((item, idx) => (
                                    <View
                                        key={`noimp-${idx}`}
                                        style={[
                                            styles.tableDataRow,
                                            {
                                                backgroundColor:
                                                    (haberesImponibles.length + idx) % 2 === 0
                                                        ? "#FFFFFF"
                                                        : "#F8F9FA",
                                            },
                                        ]}
                                    >
                                        <Text style={styles.tableCellConcept}>{item.concepto}</Text>
                                        <Text style={styles.tableCellAmount}>{formatCurrency(item.monto)}</Text>
                                    </View>
                                ))}
                            </>
                        )}

                        {/* Subtotal Imponible */}
                        {haberesNoImponibles.length > 0 && (
                            <View style={styles.columnTotalRow}>
                                <Text style={styles.columnTotalLabel}>Subtotal imponible</Text>
                                <Text style={styles.columnTotalAmount}>{formatCurrency(totalImponibles)}</Text>
                            </View>
                        )}
                    </View>

                    {/* Descuentos Column */}
                    <View style={styles.tableColumnRight}>
                        <Text style={styles.sectionTitle}>DESCUENTOS</Text>

                        <View style={styles.tableHeaderRow}>
                            <Text style={styles.tableHeaderConcept}>Concepto</Text>
                            <Text style={styles.tableHeaderAmount}>Monto</Text>
                        </View>

                        {data.deductions.length === 0 ? (
                            <View style={styles.tableDataRow}>
                                <Text style={[styles.tableCellConcept, { color: "#999" }]}>
                                    Sin descuentos
                                </Text>
                                <Text style={[styles.tableCellAmount, { color: "#999" }]}>
                                    —
                                </Text>
                            </View>
                        ) : (
                            data.deductions.map((item, idx) => (
                                <View
                                    key={`ded-${idx}`}
                                    style={[
                                        styles.tableDataRow,
                                        { backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8F9FA" },
                                    ]}
                                >
                                    <Text style={styles.tableCellConcept}>{item.concepto}</Text>
                                    <Text style={styles.tableCellAmount}>
                                        -{formatCurrency(item.monto)}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {/* ── Summary ── */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Haberes</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(data.totalHaberes)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Descuentos</Text>
                        <Text style={styles.summaryValue}>-{formatCurrency(data.totalDescuentos)}</Text>
                    </View>
                    <View style={styles.liquidoRow}>
                        <Text style={styles.liquidoLabel}>Líquido a pagar</Text>
                        <Text style={styles.liquidoValue}>{formatCurrency(data.liquido)}</Text>
                    </View>
                    <Text style={styles.liquidoInWords}>
                        {numberToWords(data.liquido)}
                    </Text>
                </View>

                {/* ── Bottom ── */}
                <View style={styles.bottomSection}>
                    <View style={styles.signatureLine}>
                        <Text style={styles.signatureText}>Firma Empleador</Text>
                    </View>

                    <Text style={styles.dateRow}>Santiago, {todayString()}</Text>

                    <Text style={styles.legalFooter}>
                        Documento generado electrónicamente según Art. 2 de la Ley 19.799 — No requiere firma holográfica
                    </Text>

                    <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) =>
                            `Página ${pageNumber} de ${totalPages}`
                        }
                    />
                </View>
            </Page>
        </Document>
    );
}
