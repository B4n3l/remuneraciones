import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 8,
        fontFamily: "Helvetica",
    },
    header: {
        marginBottom: 10,
        borderBottom: "2 solid #000",
        paddingBottom: 6,
    },
    title: {
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        textAlign: "center",
        marginBottom: 6,
    },
    companyInfo: {
        marginBottom: 8,
        fontSize: 9,
    },
    companyName: {
        fontSize: 10,
        fontWeight: "bold",
    },
    table: {
        width: "100%",
        marginBottom: 8,
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "0.5 solid #ccc",
        alignItems: "center",
        minHeight: 16,
    },
    tableRowHeader: {
        flexDirection: "row",
        borderBottom: "1 solid #000",
        backgroundColor: "#e0e0e0",
        alignItems: "center",
        minHeight: 18,
    },
    tableRowTotal: {
        flexDirection: "row",
        borderTop: "1 solid #000",
        borderBottom: "1 solid #000",
        backgroundColor: "#f5f5f5",
        alignItems: "center",
        minHeight: 18,
        fontWeight: "bold",
    },
    colIndex: { width: 20, textAlign: "center" },
    colName: { width: 80, paddingLeft: 2 },
    colCargo: { width: 60, paddingLeft: 2 },
    colDias: { width: 22, textAlign: "center" },
    colNum: { width: 45, textAlign: "right", paddingRight: 2 },
    colNumBold: { width: 45, textAlign: "right", paddingRight: 2, fontWeight: "bold" },
    footer: {
        marginTop: 20,
        paddingTop: 10,
    },
    signatureLine: {
        borderTop: "1 solid #000",
        marginTop: 25,
        paddingTop: 4,
        width: "45%",
        textAlign: "center",
        fontSize: 9,
    },
});

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
    }).format(value);
}

function formatRut(rut: string): string {
    const clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
    if (clean.length < 2) return rut;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted}-${dv}`;
}

interface LibroItem {
    worker: {
        nombres: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
        rut: string;
        cargo: string;
    };
    diasTrabajados: number;
    horasExtra: number;
    totalHaberes: number;
    sueldoBase: number;
    gratificacion: number;
    horasExtraMonto: number;
    bonos: number;
    afp: number;
    salud: number;
    cesantia: number;
    impuesto: number;
    totalDescuentos: number;
    liquidoPagar: number;
}

interface LibroData {
    company: {
        razonSocial: string;
        rut: string;
    };
    period: {
        yearMonth: string;
        fechaInicio: string;
        fechaFin: string;
        status: string;
    };
    items: LibroItem[];
    totals: {
        diasTrabajados: number;
        horasExtra: number;
        totalHaberes: number;
        sueldoBase: number;
        gratificacion: number;
        horasExtraMonto: number;
        bonos: number;
        afp: number;
        salud: number;
        cesantia: number;
        impuesto: number;
        totalDescuentos: number;
        liquidoPagar: number;
    };
}

export function LibroRemuneracionesPDF({ data }: { data: LibroData }) {
    const [year, month] = data.period.yearMonth.split("-");
    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const periodStr = `${months[parseInt(month) - 1]} ${year}`;

    const headerRow = (
        <View style={styles.tableRowHeader}>
            <Text style={styles.colIndex}>N°</Text>
            <Text style={styles.colName}>Nombre</Text>
            <Text style={styles.colCargo}>Cargo</Text>
            <Text style={styles.colDias}>Días</Text>
            <Text style={styles.colNum}>Sueldo Base</Text>
            <Text style={styles.colNum}>Gratif.</Text>
            <Text style={styles.colNum}>H.Extra</Text>
            <Text style={styles.colNum}>Bonos</Text>
            <Text style={styles.colNumBold}>Tot.Hab</Text>
            <Text style={styles.colNum}>AFP</Text>
            <Text style={styles.colNum}>Salud</Text>
            <Text style={styles.colNum}>Cesant.</Text>
            <Text style={styles.colNum}>Imp.</Text>
            <Text style={styles.colNumBold}>Tot.Desc</Text>
            <Text style={styles.colNumBold}>Líquido</Text>
        </View>
    );

    return (
        <Document>
            <Page size="LEGAL" orientation="landscape" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>LIBRO DE REMUNERACIONES</Text>
                    <Text style={styles.subtitle}>{periodStr}</Text>
                </View>

                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{data.company.razonSocial}</Text>
                    <Text>RUT: {formatRut(data.company.rut)}</Text>
                </View>

                <View style={styles.table}>
                    {headerRow}
                    {data.items.map((item, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={styles.colIndex}>{idx + 1}</Text>
                            <Text style={styles.colName}>
                                {item.worker.nombres} {item.worker.apellidoPaterno} {item.worker.apellidoMaterno}
                            </Text>
                            <Text style={styles.colCargo}>{item.worker.cargo}</Text>
                            <Text style={styles.colDias}>{item.diasTrabajados}</Text>
                            <Text style={styles.colNum}>{formatCurrency(item.sueldoBase)}</Text>
                            <Text style={styles.colNum}>{formatCurrency(item.gratificacion)}</Text>
                            <Text style={styles.colNum}>{formatCurrency(item.horasExtraMonto)}</Text>
                            <Text style={styles.colNum}>{formatCurrency(item.bonos)}</Text>
                            <Text style={styles.colNumBold}>{formatCurrency(item.totalHaberes)}</Text>
                            <Text style={styles.colNum}>{formatCurrency(item.afp)}</Text>
                            <Text style={styles.colNum}>{formatCurrency(item.salud)}</Text>
                            <Text style={styles.colNum}>{formatCurrency(item.cesantia)}</Text>
                            <Text style={styles.colNum}>{formatCurrency(item.impuesto)}</Text>
                            <Text style={styles.colNumBold}>{formatCurrency(item.totalDescuentos)}</Text>
                            <Text style={styles.colNumBold}>{formatCurrency(item.liquidoPagar)}</Text>
                        </View>
                    ))}
                    <View style={styles.tableRowTotal}>
                        <Text style={styles.colIndex}></Text>
                        <Text style={styles.colName}>TOTALES</Text>
                        <Text style={styles.colCargo}></Text>
                        <Text style={styles.colDias}>{data.totals.diasTrabajados}</Text>
                        <Text style={styles.colNum}>{formatCurrency(data.totals.sueldoBase)}</Text>
                        <Text style={styles.colNum}>{formatCurrency(data.totals.gratificacion)}</Text>
                        <Text style={styles.colNum}>{formatCurrency(data.totals.horasExtraMonto)}</Text>
                        <Text style={styles.colNum}>{formatCurrency(data.totals.bonos)}</Text>
                        <Text style={styles.colNumBold}>{formatCurrency(data.totals.totalHaberes)}</Text>
                        <Text style={styles.colNum}>{formatCurrency(data.totals.afp)}</Text>
                        <Text style={styles.colNum}>{formatCurrency(data.totals.salud)}</Text>
                        <Text style={styles.colNum}>{formatCurrency(data.totals.cesantia)}</Text>
                        <Text style={styles.colNum}>{formatCurrency(data.totals.impuesto)}</Text>
                        <Text style={styles.colNumBold}>{formatCurrency(data.totals.totalDescuentos)}</Text>
                        <Text style={styles.colNumBold}>{formatCurrency(data.totals.liquidoPagar)}</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.signatureLine}>
                        <Text>Firma Representante Legal</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
