import React from "react";
import io from "socket.io-client";
import axios from "axios";
let socket = io("http://localhost:4000");

class Chat extends React.Component {

    constructor(props) {
        super(props);
        const username = "Nobody";
        this.state = {
            input: "",
            roomInput: "",
            username,
            messages: [`${username} has joined the chat!`],
            roomName: "",
            rooms: []
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleRoomChange = this.handleRoomChange.bind(this);
        this.addRoom = this.addRoom.bind(this);
        this.addMessage = this.addMessage.bind(this);

    }

    async componentDidMount() {
        //this.setState({ messages: ["You have joined the chat as '" + this.state.username + "'."] })

        const addMessage = this.addMessage
        socket.on("chat_message", (data) => {
            addMessage(data.username + ": " + data.message);
        });
        socket.on("user_join", (data) => {
            addMessage(data.username + " just joined the chat!");
        });
        socket.on("user_leave", function (data) {
            addMessage(data + " has left the chat.");
        });



        // socket.emit("join_room", {
        //     username: this.state.username,
        //     prevRoom: this.state.roomName,
        //     currRoom: this.state.roomName
        // });

        let roomInfo = await axios.get("http://localhost:5000/api/chatrooms/")
            .then(data => data.data)
            .then(res => res);

        console.log(roomInfo)
        await this.setState({ rooms: roomInfo })
        await this.setState({ roomName: roomInfo[0].chatroomName })
        
        socket.emit("user_join", {
            username: this.state.username,
            roomName: this.state.roomName
        });
        // let oldMessages = await axios.get("http://localhost:5000/api/chatrooms/messages/"+this.state.roomName)
        //     .then(data => data.data)
        //     .then(res => res);

        // await this.setState({ messages: [...this.state.messages, ...oldMessages] })

        // let welcomeMessage = await axios.post("http://localhost:5000/api/chatrooms/messages", {
        //     message: this.state.username + " just joined the chat!",
        //     chatroomName: this.state.roomName
        // }).then(data => data.data)

        // console.log(welcomeMessage)
        // await this.setState({ messages: [...welcomeMessage.messages] })
    }

    addMessage(message){
        this.setState({ messages: [...this.state.messages, message] })        
    }

    addtoRedis(message){
        axios.post("http://localhost:5000/api/chatrooms/messages", {
            message: message,
            chatroomName: this.state.roomName
        }).then(data => data.data)  
    }

    async addRoom(event) {
        event.preventDefault();
        let newRoom = this.state.roomInput
        this.setState({ roomInput: "" });

        await axios.post("http://localhost:5000/api/chatrooms/", {
            chatroomName: newRoom
        }).then(data => data.data)
            .then(res => this.setState({ rooms: [...this.state.rooms, res] }));
        console.log(this.state.rooms)
    }

    async handleChange(event) {
        this.setState({ [event.target.name]: event.target.value });
    }

    async handleRoomChange(event) {
        let prevRoom = this.state.roomName
        let currRoom = event.target.value
        await this.setState({ roomName: currRoom });

        console.log(await this.state.username)
        socket.emit("join_room", {
            username: this.state.username,
            prevRoom: prevRoom,
            currRoom: currRoom
        });

        console.log("here")
        // this.addMessage(this.state.username + " just joined the chat!");

        // console.log(currRoom)
        // console.log(this.state.roomName)
        await this.setState({ messages: await axios.get("http://localhost:5000/api/chatrooms/messages/"+currRoom)
            .then(data => data.data)
            .then(res => res)
        });
        // console.log("ans also here")
        // console.log(prevMessages)
        // let emptyArr = []
        // this.setState({ messages: emptyArr });
        // console.log(this.state.messages)
    }

    async handleSubmit(event) {
        event.preventDefault();
        this.addMessage(this.state.username + ": " + this.state.input);
        this.addtoRedis(this.state.username + ": " + this.state.input)
        socket.emit("chat_message", {
            roomName: this.state.roomName,
            username: this.state.username,
            message: this.state.input
        });
        this.setState({ input: "" });
    }

    render() {
        return (
            <div>
                <header className="toolbar toolbar-header">
                    <div className="toolbar-actions">
                        <h1 className="chatTitle" style={{"margin": "0.2rem"}}>{this.state.roomName==="" ? "-" : this.state.roomName}</h1>
                        {/* <h3 className="chatTitle" style={{"margin": "0.5rem"}}>Testing testing</h3> */}
                        <form className="addChatRoom" onSubmit={this.addRoom}>
                            <input type="text" value={this.state.roomInput} style={{"float": "left"}} name="roomInput" onChange={this.handleChange} />
                            <div style={{"overflow": "hidden", "padding-left": ".2em", "padding-right": ".2em"}}>
                                <button className="btn btn-default" type="submit" style={{"width": "100%"}}>Submit</button>
                            </div>
                        </form>
                    </div>
                </header>
                <ul className="messages">
                    {this.state.messages.map(item => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
                <form className="chatbox" onSubmit={this.handleSubmit}>
                    
                    <select className="form-control dropdown" id="room-selector" onChange={this.handleRoomChange}>
                        {this.state.rooms.map((i) =>
                            <option name="roomName" key={i.chatroomName} value={i.chatroomName}>{i.chatroomName}</option>
                        )}
                    </select>
                    <input className="form-control" type="text" value={this.state.input}  placeholder="Enter your message here." name="input" onChange={this.handleChange} />
                    <button className="btn btn-default" type="submit" value="Submit">
                        <span className="icon icon-rocket icon-text"></span>
                        Submit
                        </button>
                </form>
            </div>
        )
    }
}

export default Chat;