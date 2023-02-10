import {OptionsObject, useSnackbar} from "notistack";

type ResultHandler<T> = (res: RequestResult, argument?: T) => void;

export function useRequestResult<T>(success?: ResultHandler<T>, error?: ResultHandler<T>): ResultHandler<T> {
    const {enqueueSnackbar} = useSnackbar();
    return (res, argument = undefined) => {
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
            if (error) error(res, argument)

        } else {
            if (success) success(res, argument)
        }
    }
}