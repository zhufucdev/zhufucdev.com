import {OptionsObject, useSnackbar} from "notistack";

type ResultHandler = (res: RequestResult) => void;

export function useRequestResult(success?: () => void, error?: () => void): ResultHandler {
    const {enqueueSnackbar} = useSnackbar();
    return (res) => {
        if (!res.success) {
            const options: OptionsObject = {
                variant: "error",
                anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "center"
                }
            }
            if (res.msg) {
                if (res.respond) {
                    enqueueSnackbar(`${res.msg} (${res.respond})`, options);
                } else {
                    enqueueSnackbar(res.msg as string, options);
                }
            } else {
                enqueueSnackbar("未知错误", options)
            }
            if (error) error()

        } else {
            if (success) success()
        }
    }
}