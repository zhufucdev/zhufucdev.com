import PlaceHolder from "../componenets/PlaceHolder";
import LockedIcon from "@mui/icons-material/PublicOffOutlined";

export default function UnauthorizedPage() {
    return <PlaceHolder icon={LockedIcon} title="没有权限" sx={{mt: 2}}/>
}