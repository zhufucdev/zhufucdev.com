import {SxProps, Theme, Typography} from "@mui/material";
import {OverridableStringUnion} from "@mui/types";
import {Variant} from "@mui/material/styles/createTypography";
import {TypographyPropsVariantOverrides} from "@mui/material/Typography/Typography";

type ReCaptchaPolicyProps = {
    variant: OverridableStringUnion<Variant | 'inherit', TypographyPropsVariantOverrides>,
    sx?: SxProps<Theme>
};

export function ReCaptchaPolicy(props: ReCaptchaPolicyProps): JSX.Element {
    const base: SxProps<Theme> = {
        mt: 2
    };
    return <Typography variant={props.variant} color="text.disabled" sx={{...base, ...props.sx}}>
        此网站受reCAPTCHA保护，因而Google的
        <a href="https://policies.google.cn/privacy">隐私权政策</a>和
        <a href="https://policies.google.cn/terms">服务条款</a>生效。
    </Typography>
}