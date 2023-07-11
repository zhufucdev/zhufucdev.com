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
}

const nameOfTag: Tags = {
    't-from': '翻译自',
    'pr-from': '拉取请求',
    lang: '语言',
    hidden: '私享',
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
