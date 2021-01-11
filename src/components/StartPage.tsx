import "react-toastify/dist/ReactToastify.css";

import { Box, Button, FormField, Heading, TextInput } from "grommet";
import { Gremlin, Link } from "grommet-icons";
import { ToastContainer, toast } from "react-toastify";
import { useRef, useState } from "react";

import { ChatConnection } from "../api/ChatConnection";
import { getRandomFruit } from "../api/Fruit";
import { parseToken } from "../api/helpers";
import { parseZoomLink } from "../api/ZoomLink";
import { useHistory } from "react-router-dom";

interface IStartPageProps {
  chatConnection: ChatConnection;
  handleChatConnectionUpdate: (updated: ChatConnection) => void;
}

const StartPage = (props: IStartPageProps) => {
  const token = window.localStorage.getItem("token");

  return (
    <Box
      flex
      align='center'
      justify='center'
      overflow={{ horizontal: "hidden" }}
      margin="medium"
      responsive
    >
      <ToastContainer
        position='top-right'
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Heading textAlign="center">
        Start Chatting with Umbra
      </Heading>
      {token ? (
        <JoinRoomForm
          handleChatConnectionUpdate={props.handleChatConnectionUpdate}
        />
      ) : (
        <VerifyEmailForm />
      )}
    </Box>
  );
};

interface IJoinRoomFormProps {
  handleChatConnectionUpdate: (updated: ChatConnection) => void;
}

const JoinRoomForm = (props: IJoinRoomFormProps) => {
  const [zoomLink, setZoomLink] = useState("");
  const [displayName, setDisplayName] = useState("");
  const history = useHistory();

  // placeholder should not be re-calculated on each render
  const displayNamePlaceholder = useRef(`Anonymous ${getRandomFruit()}`);

  const handleJoin = () => {
    // try to read token
    const token = window.localStorage.getItem("token") || "";
    const parsedToken = parseToken(token);
    if (!parsedToken) {
      toast.error("Oops, it doesn't look like you are signed in.");
      if (process.env.NODE_ENV === "production") {
        // remove corrupted token
        window.localStorage.removeItem("token");
      }
    }
    // create room name from parsed zoom link
    const roomName = parseZoomLink(zoomLink);
    if (!roomName) {
      toast.error("Invalid Zoom Link or Meeting ID.");
    } else {
      props.handleChatConnectionUpdate(
        new ChatConnection(roomName, displayName, token)
      );
      history.push("/chat");
    }
  };

  return (
    <form
      onSubmit={(evt) => {
        evt.preventDefault();
        handleJoin();
      }}
    >
      <FormField label='Zoom Link'>
        <TextInput
          placeholder='https://mit.zoom.us/1234567'
          required
          icon={<Link />}
          value={zoomLink}
          onChange={(evt) => setZoomLink(evt.target.value)}
        />
      </FormField>
      <FormField label='Display Name'>
        <TextInput
          placeholder={displayNamePlaceholder.current}
          required
          icon={<Gremlin />}
          value={displayName}
          onChange={(evt) => setDisplayName(evt.target.value)}
        />
      </FormField>
      <Button
        primary
        label='Join'
        type='submit'
        color='brand'
        fill='horizontal'
      />
    </form>
  );
};

const VerifyEmailForm = () => {
  const [email, setEmail] = useState("");
  const [buttonEnabled, setButtonEnabled] = useState(true);

  const handleVerify = () => {
    var requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/sendVerificationEmail`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        if (result.error) {
          toast.error(result.error);
          setButtonEnabled(true);
        } else {
          toast.success("Look out for an email in your inbox!");
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Something broke. Try again later.");
        setButtonEnabled(true);
      });
  };

  return (
    <form
      onSubmit={(evt) => {
        evt.preventDefault();
        setButtonEnabled(false);
        handleVerify();
      }}
    >
      <FormField label='Email Address'>
        <TextInput
          placeholder="umbra@mit.edu"
          required
          value={email}
          onChange={(evt) => setEmail(evt.target.value)}
        />
      </FormField>
      <Button
        primary
        label='Next'
        type='submit'
        color='brand'
        fill='horizontal'
        disabled={!buttonEnabled}
      />
    </form>
  );
};

export default StartPage;
