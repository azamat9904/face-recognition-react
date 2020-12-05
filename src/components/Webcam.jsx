import React from 'react';

import Webcam from "react-webcam";

const videoConstraints = {
    width: 900,
    height: 1000,
    facingMode: "user"
};

const WebcamCapture = ({ webcamRef }) => {
    return (
        <>
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
            />
        </>
    );
};

export default WebcamCapture;