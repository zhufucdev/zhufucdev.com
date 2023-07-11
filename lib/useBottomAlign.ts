import React, {useState} from "react";

/**
 * Make the end of a vertical layout stick to the bottom
 *
 * @returns some references and margins
 */
export function useBottomAlign<R extends HTMLElement, C extends HTMLElement, A extends HTMLElement>() {
    const [rootBtm, setRootBtm] = useState(0);
    const [textBtm, setTextBtm] = useState(0);
    const [actionH, setActionH] = useState(0);

    const parentRef = React.useCallback((node: R) => {
        if (node) {
            setRootBtm(node.getBoundingClientRect().bottom);
        }
    }, []);
    const contentRef = React.useCallback((node: C) => {
        if (node) {
            setTextBtm(node.getBoundingClientRect().bottom);
        }
    }, []);
    const actionRef = React.useCallback((node: A) => {
        if (node) {
            setActionH(node.getBoundingClientRect().height);
        }
    }, []);
    const [actionMargin, setActionMargin] = React.useState(0);
    React.useEffect(() => {
        const margin = rootBtm - textBtm - actionH;
        setActionMargin(margin);
    }, [rootBtm, textBtm, actionH]);

    return {parentRef, contentRef, actionRef, actionMargin};
}