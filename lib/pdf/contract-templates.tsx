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
    companyAddress: string;
    legalRep: string;
    legalRepRut: string;

    // Worker
    workerName: string;
    workerRut: string;
    workerAddress: string;
    workerNationality: string;

    // Contract details
    type: "INDEFINIDO" | "PLAZO_FIJO" | "OBRA_FAENA";
    startDate: string;
    endDate?: string; // For plazo fijo
    cargo: string;
    jornada: string;
    schedule: string;
    workplace: string;
    baseSalary: number;
    benefits?: string;
    obraDetails?: string; // For obra/faena
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

// Indefinido Contract Template
export function IndefinidoContract({ data }: { data: ContractData }) {
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <Text style={styles.title}>Contrato de Trabajo a Plazo Indefinido</Text>

                {/* Parties */}
                <View style={styles.section}>
                    <Text style={styles.text}>
                        En <Text style={styles.bold}>{data.companyAddress}</Text>, a <Text style={styles.bold}>{data.startDate}</Text>,
                        entre <Text style={styles.bold}>{data.companyName}</Text>, RUT <Text style={styles.bold}>{formatRut(data.companyRut)}</Text>,
                        representada por don(ña) <Text style={styles.bold}>{data.legalRep}</Text>,
                        RUT <Text style={styles.bold}>{formatRut(data.legalRepRut)}</Text>, en adelante "el Empleador",
                        y don(ña) <Text style={styles.bold}>{data.workerName}</Text>,
                        RUT <Text style={styles.bold}>{formatRut(data.workerRut)}</Text>, de nacionalidad <Text style={styles.bold}>{data.workerNationality}</Text>,
                        domiciliado(a) en <Text style={styles.bold}>{data.workerAddress}</Text>, en adelante "el Trabajador",
                        se ha convenido el siguiente contrato de trabajo:
                    </Text>
                </View>

                {/* PRIMERA: Naturaleza de los servicios */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>PRIMERA: NATURALEZA DE LOS SERVICIOS</Text>
                    <Text style={styles.text}>
                        El Trabajador se compromete a desempeñar el cargo de <Text style={styles.bold}>{data.cargo}</Text>,
                        prestando servicios en <Text style={styles.bold}>{data.workplace}</Text>,
                        y cumpliendo con todas las funciones y responsabilidades propias del cargo,
                        así como aquellas que le sean encomendadas por el Empleador en el ámbito de sus competencias.
                    </Text>
                </View>

                {/* SEGUNDA: Jornada de trabajo */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>SEGUNDA: JORNADA DE TRABAJO</Text>
                    <Text style={styles.text}>
                        La jornada de trabajo será de tipo <Text style={styles.bold}>{data.jornada}</Text>,
                        con el siguiente horario: <Text style={styles.bold}>{data.schedule}</Text>.
                    </Text>
                    <Text style={styles.text}>
                        El Trabajador tendrá derecho a 15 días hábiles de vacaciones anuales,
                        de acuerdo a lo establecido en el Código del Trabajo.
                    </Text>
                </View>

                {/* TERCERA: Remuneración */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>TERCERA: REMUNERACIÓN</Text>
                    <Text style={styles.text}>
                        El Empleador pagará al Trabajador una remuneración mensual de <Text style={styles.bold}>{formatCurrency(data.baseSalary)}</Text>
                        (PESOS CHILENOS), pagadera el último día hábil de cada mes.
                    </Text>
                    {data.benefits && (
                        <Text style={styles.text}>
                            Adicionalmente, el Trabajador recibirá los siguientes beneficios: {data.benefits}
                        </Text>
                    )}
                    <Text style={styles.text}>
                        Sobre esta remuneración se efectuarán los descuentos legales correspondientes
                        (cotizaciones previsionales, de salud y otros establecidos por ley).
                    </Text>
                </View>

                {/* CUARTA: Duración */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>CUARTA: DURACIÓN</Text>
                    <Text style={styles.text}>
                        El presente contrato es a plazo indefinido y comenzará a regir a partir del <Text style={styles.bold}>{data.startDate}</Text>.
                    </Text>
                </View>

                {/* QUINTA: Obligaciones */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>QUINTA: OBLIGACIONES DEL TRABAJADOR</Text>
                    <Text style={styles.text}>El Trabajador se compromete a:</Text>
                    <Text style={styles.indented}>a) Cumplir con el Reglamento Interno de la empresa.</Text>
                    <Text style={styles.indented}>b) Mantener confidencialidad sobre información de la empresa.</Text>
                    <Text style={styles.indented}>c) Cumplir con las normas de higiene y seguridad.</Text>
                    <Text style={styles.indented}>d) Realizar sus labores con diligencia y buena fe.</Text>
                </View>

                {/* SEXTA: Término */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>SEXTA: TÉRMINO DEL CONTRATO</Text>
                    <Text style={styles.text}>
                        El presente contrato podrá terminar por las causales establecidas en el Artículo 159, 160 y 161 del Código del Trabajo,
                        o por mutuo acuerdo de las partes.
                    </Text>
                </View>

                {/* Signatures */}
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

                {/* Footer */}
                <Text style={styles.footer}>
                    Contrato sujeto a las disposiciones del Código del Trabajo de Chile
                </Text>
            </Page>
        </Document>
    );
}

// Plazo Fijo Contract Template
export function PlazoFijoContract({ data }: { data: ContractData }) {
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <Text style={styles.title}>Contrato de Trabajo a Plazo Fijo</Text>

                {/* Parties */}
                <View style={styles.section}>
                    <Text style={styles.text}>
                        En <Text style={styles.bold}>{data.companyAddress}</Text>, a <Text style={styles.bold}>{data.startDate}</Text>,
                        entre <Text style={styles.bold}>{data.companyName}</Text>, RUT <Text style={styles.bold}>{formatRut(data.companyRut)}</Text>,
                        representada por don(ña) <Text style={styles.bold}>{data.legalRep}</Text>,
                        RUT <Text style={styles.bold}>{formatRut(data.legalRepRut)}</Text>, en adelante "el Empleador",
                        y don(ña) <Text style={styles.bold}>{data.workerName}</Text>,
                        RUT <Text style={styles.bold}>{formatRut(data.workerRut)}</Text>, de nacionalidad <Text style={styles.bold}>{data.workerNationality}</Text>,
                        domiciliado(a) en <Text style={styles.bold}>{data.workerAddress}</Text>, en adelante "el Trabajador",
                        se ha convenido el siguiente contrato de trabajo a plazo fijo:
                    </Text>
                </View>

                {/* PRIMERA: Naturaleza de los servicios */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>PRIMERA: NATURALEZA DE LOS SERVICIOS</Text>
                    <Text style={styles.text}>
                        El Trabajador se compromete a desempeñar el cargo de <Text style={styles.bold}>{data.cargo}</Text>,
                        prestando servicios en <Text style={styles.bold}>{data.workplace}</Text>.
                    </Text>
                </View>

                {/* SEGUNDA: Jornada de trabajo */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>SEGUNDA: JORNADA DE TRABAJO</Text>
                    <Text style={styles.text}>
                        La jornada de trabajo será de tipo <Text style={styles.bold}>{data.jornada}</Text>,
                        con el siguiente horario: <Text style={styles.bold}>{data.schedule}</Text>.
                    </Text>
                </View>

                {/* TERCERA: Remuneración */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>TERCERA: REMUNERACIÓN</Text>
                    <Text style={styles.text}>
                        El Empleador pagará al Trabajador una remuneración mensual de <Text style={styles.bold}>{formatCurrency(data.baseSalary)}</Text>,
                        pagadera el último día hábil de cada mes, con los descuentos legales correspondientes.
                    </Text>
                    {data.benefits && (
                        <Text style={styles.text}>
                            Beneficios adicionales: {data.benefits}
                        </Text>
                    )}
                </View>

                {/* CUARTA: Duración y Renovación */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>CUARTA: DURACIÓN Y RENOVACIÓN</Text>
                    <Text style={styles.text}>
                        El presente contrato tendrá una duración determinada,
                        iniciando el <Text style={styles.bold}>{data.startDate}</Text> y
                        finalizando el <Text style={styles.bold}>{data.endDate}</Text>.
                    </Text>
                    <Text style={styles.text}>
                        Si el Trabajador continúa prestando servicios con conocimiento del Empleador después del vencimiento del plazo,
                        el contrato se transformará en indefinido, de acuerdo al Artículo 159 N°4 del Código del Trabajo.
                    </Text>
                    <Text style={styles.text}>
                        Este contrato podrá renovarse por mutuo acuerdo de las partes,
                        siempre que la suma de los períodos no exceda un año.
                    </Text>
                </View>

                {/* QUINTA: Obligaciones */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>QUINTA: OBLIGACIONES DEL TRABAJADOR</Text>
                    <Text style={styles.text}>El Trabajador se compromete a:</Text>
                    <Text style={styles.indented}>a) Cumplir con el Reglamento Interno de la empresa.</Text>
                    <Text style={styles.indented}>b) Mantener confidencialidad sobre información de la empresa.</Text>
                    <Text style={styles.indented}>c) Cumplir con las normas de higiene y seguridad.</Text>
                </View>

                {/* SEXTA: Término */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>SEXTA: TÉRMINO DEL CONTRATO</Text>
                    <Text style={styles.text}>
                        Además del vencimiento del plazo, este contrato podrá terminar por las causales del Código del Trabajo.
                    </Text>
                </View>

                {/* Signatures */}
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
                    Contrato a Plazo Fijo - Código del Trabajo de Chile, Artículo 159 N°4
                </Text>
            </Page>
        </Document>
    );
}

// Obra/Faena Contract Template
export function ObraFaenaContract({ data }: { data: ContractData }) {
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <Text style={styles.title}>Contrato de Trabajo por Obra o Faena</Text>

                {/* Parties */}
                <View style={styles.section}>
                    <Text style={styles.text}>
                        En <Text style={styles.bold}>{data.companyAddress}</Text>, a <Text style={styles.bold}>{data.startDate}</Text>,
                        entre <Text style={styles.bold}>{data.companyName}</Text>, RUT <Text style={styles.bold}>{formatRut(data.companyRut)}</Text>,
                        representada por don(ña) <Text style={styles.bold}>{data.legalRep}</Text>,
                        RUT <Text style={styles.bold}>{formatRut(data.legalRepRut)}</Text>, en adelante "el Empleador",
                        y don(ña) <Text style={styles.bold}>{data.workerName}</Text>,
                        RUT <Text style={styles.bold}>{formatRut(data.workerRut)}</Text>, de nacionalidad <Text style={styles.bold}>{data.workerNationality}</Text>,
                        domiciliado(a) en <Text style={styles.bold}>{data.workerAddress}</Text>, en adelante "el Trabajador",
                        se ha convenido el siguiente contrato de trabajo por obra o faena determinada:
                    </Text>
                </View>

                {/* PRIMERA: Obra o Faena */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>PRIMERA: OBRA O FAENA DETERMINADA</Text>
                    <Text style={styles.text}>
                        El Trabajador se compromete a desempeñar el cargo de <Text style={styles.bold}>{data.cargo}</Text>,
                        para la realización de la siguiente obra o faena:
                    </Text>
                    <Text style={[styles.text, { marginLeft: 20, marginTop: 5 }]}>
                        {data.obraDetails || "Obra o faena específica a desarrollar según instrucciones del empleador."}
                    </Text>
                    <Text style={styles.text}>
                        El contrato terminará automáticamente al concluir la obra o faena para la cual fue contratado.
                    </Text>
                </View>

                {/* SEGUNDA: Lugar de prestación */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>SEGUNDA: LUGAR DE PRESTACIÓN DE SERVICIOS</Text>
                    <Text style={styles.text}>
                        El Trabajador prestará sus servicios en <Text style={styles.bold}>{data.workplace}</Text>,
                        pudiendo el Empleador disponer cambios de ubicación cuando las necesidades de la obra lo requieran.
                    </Text>
                </View>

                {/* TERCERA: Jornada de trabajo */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>TERCERA: JORNADA DE TRABAJO</Text>
                    <Text style={styles.text}>
                        La jornada de trabajo será de tipo <Text style={styles.bold}>{data.jornada}</Text>,
                        con el siguiente horario: <Text style={styles.bold}>{data.schedule}</Text>.
                    </Text>
                </View>

                {/* CUARTA: Remuneración */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>CUARTA: REMUNERACIÓN</Text>
                    <Text style={styles.text}>
                        El Empleador pagará al Trabajador una remuneración mensual de <Text style={styles.bold}>{formatCurrency(data.baseSalary)}</Text>,
                        con los descuentos legales correspondientes.
                    </Text>
                    {data.benefits && (
                        <Text style={styles.text}>
                            Beneficios: {data.benefits}
                        </Text>
                    )}
                </View>

                {/* QUINTA: Vigencia */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>QUINTA: VIGENCIA</Text>
                    <Text style={styles.text}>
                        El presente contrato regirá desde el <Text style={styles.bold}>{data.startDate}</Text> y
                        terminará al concluir la obra o faena para la cual fue contratado el Trabajador.
                    </Text>
                    <Text style={styles.text}>
                        El Empleador notificará al Trabajador con al menos 5 días de anticipación la conclusión de la obra o faena.
                    </Text>
                </View>

                {/* SEXTA: Obligaciones */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>SEXTA: OBLIGACIONES DEL TRABAJADOR</Text>
                    <Text style={styles.text}>El Trabajador se compromete a:</Text>
                    <Text style={styles.indented}>a) Cumplir con el Reglamento Interno.</Text>
                    <Text style={styles.indented}>b) Completar la obra o faena en los términos acordados.</Text>
                    <Text style={styles.indented}>c) Cumplir normas de seguridad.</Text>
                </View>

                {/* SÉPTIMA: Término */}
                <View style={styles.section}>
                    <Text style={styles.clauseTitle}>SÉPTIMA: TÉRMINO</Text>
                    <Text style={styles.text}>
                        Este contrato terminará por conclusión de la obra o faena, o por las causales del Código del Trabajo.
                    </Text>
                </View>

                {/* Signatures */}
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
                    Contrato por Obra o Faena - Código del Trabajo de Chile, Artículo 159 N°5
                </Text>
            </Page>
        </Document>
    );
}
