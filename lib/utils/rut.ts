/**
 * Format a Chilean RUT number with dots and dash
 * Example: 12345678-9 -> 12.345.678-9
 */
export function formatRut(value: string): string {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^0-9kK]/g, '');

    if (cleaned.length === 0) return '';

    // Split number and verification digit
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1).toUpperCase();

    if (body.length === 0) return dv;

    // Add dots to the body
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formattedBody}-${dv}`;
}

/**
 * Clean RUT for storage (remove formatting)
 */
export function cleanRut(value: string): string {
    return value.replace(/\./g, '').replace(/-/g, '');
}

/**
 * Validate Chilean RUT
 */
export function validateRut(rut: string): boolean {
    // Clean the RUT
    const cleaned = cleanRut(rut);

    if (cleaned.length < 2) return false;

    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1).toUpperCase();

    // Calculate verification digit
    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDv = 11 - (sum % 11);
    const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

    return dv === calculatedDv;
}
