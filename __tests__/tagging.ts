import {expect, test} from "@jest/globals";
import {readTags, stringifyTags, TagKey, Tags} from "../lib/tagging";


const magicId = 'qwertyui000';
test('should read tags', () => {
    const tags = [`t-from: ${magicId}`, `lang: en-US`, 'hidden']
    const parsed = readTags({tags});

    expect(parsed[TagKey.Hidden]).toBeTruthy();
    expect(parsed[TagKey.TranslatedFrom]).toBe(magicId);
    expect(parsed[TagKey.Language]).toBe('en-US');
})

test('should write tags', () => {
    const tags: Tags = {
        'hidden': true,
        'pr-from': magicId,
    }

    const strArr = stringifyTags(tags);
    expect(strArr[0]).toBe('hidden');
    expect(strArr[1]).toBe(`pr-from:${magicId}`);
})