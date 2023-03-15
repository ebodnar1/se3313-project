import React from "react";
import {Outlet} from "react-router-dom";
import HeaderBar from "./HeaderBar.js";

const Layout = ({round, timeRemaining, gameState}) => {
    return (
        <>
            <HeaderBar round={round} timeRemaining={timeRemaining} gameState={gameState}/>
            <Outlet/>
        </>
    )
}

export default Layout;