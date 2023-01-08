import {
  Button,
  Grid,
  Popover,
  PopoverProps,
  Typography,
  Box,
} from "@mui/material";

import Link from "next/link";

export default function LoginPopover(props: PopoverProps) {
  return (
    <Popover {...props}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5">登录以继续</Typography>
        <Grid container flexDirection="row-reverse" mt={1}>
          <Grid item>
            <Button
              variant="outlined"
              component={Link}
              href="/login"
            >
              登录
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Popover>
  );
}
