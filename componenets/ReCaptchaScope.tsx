import {GoogleReCaptchaProvider} from "react-google-recaptcha-v3";
import React from "react";

export const ReCaptchaScope = (props: any) => <GoogleReCaptchaProvider {...props} useRecaptchaNet/>

