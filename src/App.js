
import React, { useRef, useCallback, useState, useEffect } from 'react';
import axios from './axios';
import WebCam from './components/Webcam';
import { Button, Input, Upload, Divider } from 'antd';
import iconUrl from './assets/img/icon.png';

const header = { 'Content-Type': 'multipart/form-data' };

const getFormData = object => Object.keys(object).reduce((formData, key) => {
  formData.append(key, object[key]);
  return formData;
}, new FormData());



function App() {
  const webcamRef = useRef(null);
  const [currentImage, setCurrentImage] = useState("");
  const [fileList, setFileList] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [toggleMode, setToggleMode] = useState(false);
  const [active, setActive] = useState(0);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validatedUser, setValidatedUser] = useState(null);
  const [cancelToken, setCancelToken] = useState(axios.CancelToken.source());
  const [validationStatus, setValidationStatus] = useState(null);

  const onTakePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCurrentImage(imageSrc);
  }, [webcamRef]);

  useEffect(() => {
    axios.get('/user').then(({ data }) => {
      const newUsers = data.users.map((user) => ({
        uid: user._id,
        name: user.fullname,
        status: 'done',
        url: user.imageUrl,
        thumbUrl: user.imageUrl
      }));
      setFileList(newUsers);
    }).catch((err) => {
      console.log(err.response);
    });
  }, []);

  const onAddNewUser = () => {
    console.log(currentImage);

    const newUser = {
      name: inputValue,
      image: currentImage,
    };

    const formData = getFormData(newUser);
    setLoading(true);

    axios.post('/user', formData, { headers: header }).then(({ data }) => {
      const newUser = {
        uid: data.user._id,
        name: data.user.fullname,
        status: 'done',
        url: data.user.imageUrl,
        thumbUrl: data.user.imageUrl
      };
      setFileList([
        ...fileList,
        newUser
      ]);
    }).catch(() => {
      const err = {
        uid: Math.random() * (-1000),
        name: newUser.name,
        status: 'error',
      };
      setFileList([
        ...fileList,
        err
      ]);
    }).finally(() => {
      setInputValue("");
      setCurrentImage(null);
      setLoading(false);
    });
  };

  const filterUsers = (id) => {
    const remainedUsers = fileList.filter((user) => user.uid !== id);
    setFileList(remainedUsers);
  }

  const onRemoveHandler = (userInfo) => {
    if (userInfo.uid < 0) {
      filterUsers(userInfo.uid);
      return;
    }
    axios.delete(`/user/${userInfo.uid}`).then(({ data }) => {
      filterUsers(data.user._id);
    }).catch((e) => {
      console.log(e.response);
    });
  };

  const onToggleHandler = (status, active) => {
    setToggleMode(status);
    setActive(active);
  }

  const onStartValidation = () => {
    const currentImage = webcamRef.current.getScreenshot();
    const formData = getFormData({ image: currentImage });
    setValidationLoading(true);

    axios.post('/validateUser', formData, { headers: header, cancelToken: cancelToken.token }).then(({ data }) => {
      if (Array.isArray(data.result) & data.result.length > 0) {
        setValidatedUser(data.result[0]);
        setValidationStatus('Not running');
        return;
      }
      setValidationStatus('You are unauthorized');
    }).catch((err) => {
      setValidationStatus("Error");
    }).finally(() => {
      setValidationLoading(false);
    })
  };

  const onStopValidation = () => {
    cancelToken.cancel("Operation canceled by user");
    setCancelToken(axios.CancelToken.source());
    onReset();
  };

  const onReset = () => {
    setValidatedUser(null);
    setValidationStatus("Not running");
  };

  return (
    <div className="App">
      <div className="main-app">
        <div className="video-block">
          <h5 className="video-block__title">Face ID</h5>
          <div className="video-block__camera">
            <Divider orientation="left">Face recognition system <img src={iconUrl} alt="Face recognition" width="30" /></Divider>
            <div className="video-block__container">
              <WebCam webcamRef={webcamRef} />
            </div>
          </div>
        </div>
        <div className="sidebar">
          <div className="sidebar__mode">
            <Button onClick={() => onToggleHandler(false, 0)} className={active === 0 ? 'active' : null}>Security status</Button>
            <Button onClick={() => onToggleHandler(true, 1)} className={active === 1 ? 'active' : null}>Add/Remove Faces</Button>
          </div>
          {
            toggleMode ? <div>
              <div className="add-user">
                <div className="add-user__title">Add new</div>
                <Button block onClick={onTakePhoto}>Snap Face</Button>
                <div className="add-user__image">
                  {
                    currentImage ? <img src={currentImage} alt="currentImage" width="270" height="230" /> : <p>Snap face to see image</p>
                  }
                </div>
                <div className="add-user__info">
                  <Input
                    type="text"
                    placeholder="Enter user name"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <Button
                    type="primary"
                    onClick={onAddNewUser}
                    disabled={inputValue.trim() === "" || !currentImage}
                    loading={loading}
                  >Add Face</Button>
                </div>
              </div>
              <div className="trusted-faces">
                <div className="trusted-faces__title">Trusted faces</div>
                <div className="trusted-faces__list">
                  {
                    fileList.length !== 0 ? (<Upload
                      action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                      listType="picture"
                      fileList={[...fileList]}
                      onRemove={onRemoveHandler}
                    >
                    </Upload>) : <p className="trusted-faces__empty">No list yet</p>
                  }
                </div>
              </div>
            </div> : <div className="face-verification">
                <Divider orientation="left">Face monitoring</Divider>
                <div className="face-verification__actions">
                  <Button block onClick={onStartValidation} type="primary">Start</Button>
                  <Button block onClick={onStopValidation} type="danger">Stop</Button>
                  <Button block onClick={onReset}>Reset</Button>
                </div>
                <div className="face-verification__status">
                  <Divider orientation="left">Status</Divider>
                  <span>{validationLoading ? 'Checking user...' : validationStatus}</span>
                </div>
                {
                  validatedUser && <div className="face-verification__result">
                    <Divider orientation="left">Result:</Divider>
                    <div className="face-verification__block">
                      <img
                        className="face-verification__img"
                        src={validatedUser.user.imageUrl}
                        alt="user image" />
                    </div>
                    <div className="face-verification__name">
                      You are: <b>{validatedUser.user.fullname}</b>
                    </div>
                  </div>
                }
              </div>
          }
        </div>
      </div>
    </div >
  );
}

export default App;
