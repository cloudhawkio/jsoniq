/// <reference path="../../../typings/node-uuid/node-uuid.d.ts" />
/// <reference path="../../../typings/lodash/lodash.d.ts" />
import * as _ from "lodash";
import * as uuid from "node-uuid";
import PUL from "../../updates/PUL";
import UpdatePrimitives from "../../updates/UpdatePrimitives";
import { IStore } from "../IStore";
import { ICollection } from "../ICollection";
import { ICollections } from "../ICollections";
import { ILogEntry } from "../ILogEntry";
import MemoryCollection from "./MemoryCollection";
import MemoryTransaction from "./MemoryTransaction";

export default class MemoryStore implements IStore {

    snapshot: {} = {};

    private pul: PUL = new PUL();

    private collections: ICollections = {};

    constructor() {
        this.collections["main"] = new MemoryCollection("main", this.pul);
    }

    get(id: string): any {
        var result = this.snapshot[id];
        if(result) {
            return _.cloneDeep(result);
        } else {
            throw new Error("Item not found: " + id);
        }
    }

    put(item: any, id?: string): string {
        var ref = id ? id : uuid.v4();
        this.snapshot[ref] = item;
        return ref;
    }

    remove(id: string): MemoryStore {
        var item = this.snapshot[id];
        if(!item) {
            //TODO: throw proper error code
            throw new Error();
        }
        delete this.snapshot[id];
        return this;
    }

    getCollections(): string[] {
        return Object.keys(this.collections);
    }

    collection(name: string): ICollection {
        return this.collections[name];
    }

    status(): UpdatePrimitives {
        return this.pul.udps;
    }

    commitWith(pul: PUL): Promise<any> {
        var transaction = new MemoryTransaction(_.cloneDeep(this.snapshot));
        return pul.apply(transaction).then(() => {
            this.snapshot = transaction.snapshot;
        });
    }

    commit(): Promise<any> {
        throw new Error("Not implemented");
    }

    resetLocal(): MemoryStore {
        throw new Error("Not implemented");
    }

    init(): Promise<any> {
        throw new Error("Not implemented");
    }

    clone(url: string): Promise<any> {
        throw new Error("Not implemented");
    }

    log(from?: number, to?: number): Promise<ILogEntry> {
        throw new Error("Not implemented");
    }

    rebase(from: string, to?: string): Promise<any> {
        throw new Error("Not implemented");
    }

    reset(to: string): Promise<any> {
        throw new Error("Not implemented");
    }
}
