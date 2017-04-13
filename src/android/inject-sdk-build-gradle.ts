export function injectSdkBuildGradle(code: string, lines: string[]): string {
    let result: string = code.trim() + '\n';
    lines.forEach(x => result += '\n' + x);
    return result;
}