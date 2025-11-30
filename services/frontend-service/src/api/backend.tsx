import axios from "axios";

import { DataAddServer } from "./insertface";


export const addServer = async (data: DataAddServer) => {
    const response = await axios.post('http://localhost:1474/add_server_user', data);
    return response.data;
}