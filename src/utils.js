export function safeMod(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
}