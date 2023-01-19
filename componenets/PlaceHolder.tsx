import SvgIcon from "@mui/material/SvgIcon";
import { Grid, Typography } from "@mui/material";
import React from "react";

function PlaceHolder(props: { icon: typeof SvgIcon, title: string }) {
  const { icon, title } = props;
  return (
    <Grid container justifyContent="center" alignItems="center">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {
          React.createElement(icon, {
            style: {
              width: 48,
              height: 48
            },
            color: "disabled"
          })
        }
        <Typography variant="h5" color="text.disabled" mt={2}>{title}</Typography>
      </div>
    </Grid>
  );
}

export default PlaceHolder;
