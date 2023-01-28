import {routeWithIronSession} from "../../../../lib/session";
import {validUser} from "../../../../lib/db/token";
import {canDrop, drop, Droppable} from "../../../../lib/db/drop";

export default routeWithIronSession(async (req, res) => {
    const {type, id} = req.query;
    if (typeof id !== 'string' || typeof type !== 'string') {
        res.status(400).send('bad request');
        return
    }

    if (!await validUser(req)) {
        res.status(401).send('unauthorized');
        return
    }

    if (canDrop(type)) {
        const {acknowledged, permitted} = await drop(type as Droppable, id, req.session.userID!);
        if (acknowledged) {
            res.send('success')
        } else if (permitted) {
            res.status(500).send('database not acknowledging')
        } else {
            res.status(403).send('forbidden')
        }
    } else {
        res.status(400).send(`${type} is undroppable`);
    }
});