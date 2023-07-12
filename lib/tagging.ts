export interface WithTags {
    tags: Tags
}

export type Tags = { [key in TagKey]?: string | boolean }

export enum TagKey {
    TranslatedFrom = 't-from',
    PrFrom = 'pr-from',
    Language = 'lang',
    Hidden = 'hidden',
    Coauthor = 'coauthor',
    Private = 'private'
}

const nameOfTag: Tags = {
    't-from': '翻译自',
    'pr-from': '拉取请求',
    lang: '语言',
    hidden: '不列出',
    private: '私享',
    coauthor: '第二作者'
}

export class TagKeyUtil {
    public static getDisplayName(key: TagKey): string {
        return nameOfTag[key] as string;
    }

    public static getByName(name: string): TagKey {
        return (TagKey as any)[name] as TagKey;
    }
}

export class Tag {
    key: TagKey;
    value: string | boolean;

    constructor(key: TagKey, value?: string) {
        this.key = key;
        switch (key) {
            case TagKey.Hidden:
            case TagKey.Private:
                this.value = true;
                break;
            default:
                this.value = value ?? '';
        }
    }

    public toString(): string {
        return typeof this.value === 'string' ? `${this.key}: ${this.value}` : this.key;
    }

    hasValue(): boolean {
        return typeof this.value === 'string';
    }

    valid(): boolean {
        switch (this.key) {
            case TagKey.Hidden:
            case TagKey.Private:
                if (typeof this.value !== 'boolean') {
                    return false
                }
                break;
            case TagKey.Language:
                try {
                    const lookup = new Intl.DisplayNames(['en'], {type: 'language'});
                    if (!lookup.of(this.value as string)) {
                        return false;
                    }
                } catch (e) {
                    return false;
                }
            case TagKey.TranslatedFrom:
            case TagKey.Coauthor:
            case TagKey.PrFrom:
                if (typeof this.value !== 'string' || !this.value) {
                    return false;
                }
        }
        return true
    }

    public static readTag(str: string): Tag {
        if (str.includes(':')) {
            const [key, value] = str.split(':', 2);
            if (value) {
                return new Tag(key.trim() as TagKey, value.trim())
            }
        }
        return new Tag(str.trim() as TagKey);
    }
}

export function readTags(tags: string[]): Tags {
    if (typeof tags === 'undefined') {
        return {}
    }

    let result: Tags = {};
    for (const tag of tags) {
        const {key, value} = Tag.readTag(tag);
        if (result[key]) {
            result[key] += `,${value}`;
        } else {
            result[key] = value
        }
    }
    return result
}

export function stringifyTags(tags: Tags): string[] {
    let result: string[] = [];
    for (const tag in tags) {
        const value = tags[tag as TagKey];
        switch (typeof value) {
            case 'boolean':
                result.push(tag);
                break;
            case 'string':
                result.push(`${tag}:${value}`)
                break;
        }
    }
    return result;
}


export function checkTagsIntegrity(target: Tags): boolean {
    for (const key in target) {
        const tag = new Tag(key as TagKey, target[key as TagKey] as any);
        if (!tag.valid()) {
            return false
        }
    }
    return true
}