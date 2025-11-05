export interface metrix_vps { 
    cpu: Record<string, number>;
    mem: Record<string, number>;
    disk: Array<any>;
    net: Record<string, number>;
    logged: Array<any>;
}


