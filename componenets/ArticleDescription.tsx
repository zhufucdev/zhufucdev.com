import Typography from "@mui/material/Typography";
import {getHumanReadableTime} from "../lib/utility";
import React from "react";
import {RenderingArticle} from "./ArticleCard";
import {TagKey, TagKeyUtil} from "../lib/tagging";
import {getLanguageName, languageNameOf} from "../lib/translation";

export function ArticleDescription({data}: { data: RenderingArticle }) {
    let des = `由${data.authorNick ?? data.author}发布于${getHumanReadableTime(new Date(data.postTime))}`;

    function append(...text: string[]) {
        des += `，${text.join(' ')}`;
    }

    for (const key in data.tags) {
        switch (key as TagKey) {
            case TagKey.Coauthor:
                append(TagKeyUtil.getDisplayName(TagKey.Coauthor), data.tags.coauthor as string)
                break;
            case TagKey.Hidden:
            case TagKey.PrFrom:
                append(TagKeyUtil.getDisplayName(key as TagKey));
                break;
            case TagKey.Language:
                const lang = getLanguageName(data)
                if (lang) append(TagKeyUtil.getDisplayName(TagKey.Language), lang)
                break;
            case TagKey.TranslatedFrom:
                const lang_ = languageNameOf[data.tags["t-from"] as string];
                if (lang_) append(TagKeyUtil.getDisplayName(TagKey.TranslatedFrom), lang_)
        }
    }
    return <Typography variant="caption" color="text.secondary">{des}</Typography>
}