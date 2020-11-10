/**
 * Returns true if `value` is the string `"true"`.
 * Returns false otherwise.
 * @param value String version of the boolean
 */
export function toBoolean(value: string | undefined): boolean {
    return (value === "true")
}