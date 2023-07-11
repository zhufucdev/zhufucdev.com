export function getLanguageName(code: string | undefined): string | undefined {
    if (!code) return undefined;
    const lookup = new Intl.DisplayNames([code], {type: 'language'});
    return lookup.of(code);
}
