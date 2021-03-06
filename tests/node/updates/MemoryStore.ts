/// <reference path="../../../typings/tsd.d.ts" />
require("jasmine2-pit");
import PUL from "../../../lib/updates/PUL";
import * as jerr from "../../../lib/errors";
import MemoryStore from "../../../lib/stores/memory/MemoryStore";

declare function pit(expectation: string, assertion?: (done: () => void) => any): void;

describe("Memory Store", () => {

    it("simple test", () => {
        var store = new MemoryStore();

        expect(() => {
            store.get("a");
        }).toThrow();

        var object = {
            a: [1, 2],
            b: 2
        };

        var id = store.put(object);
        var obj = store.get(id);
        expect(obj).toEqual(object);
    });

    pit("Insert & delete", () => {
        var obj = { a: 1, b: { c: 1 } };
        var store = new MemoryStore();
        var id = store.put(obj);

        var pul = new PUL();
        pul.insert("hello", { z: 1 });
        pul.remove(id);
        return store.commitWith(pul).then(() => {
            expect(store.get("hello")).toEqual({ z: 1 });
            expect(() => { store.get(id); }).toThrow();
        });
    });

    pit("simple update (1)", () => {
        var obj = { a: 1, b: { c: 1 } };
        var store = new MemoryStore();
        var id = store.put(obj);

        var pul = new PUL();
        pul
            .insertIntoObject(id, ["b"], { d: 1 })
            .deleteFromObject(id, ["b"], ["c"]);
        expect(obj.b["d"]).toBe(undefined);
        expect(obj.b.c).toBe(1);

        var serializedPUL = pul.serialize();
        return store.commitWith(pul).then(() => {
            obj = store.get(id);
            expect(obj.b["d"]).toBe(1);
            expect(obj.b.c).toBe(undefined);
            obj = { a: 1, b: { c: 1 } };
            store = new MemoryStore();
            store.put(obj, id);
            pul = new PUL();
            pul.parse(serializedPUL);
            return store.commitWith(pul).then(() => {
                obj = store.get(id);
                expect(obj.b["d"]).toBe(1);
                expect(obj.b.c).toBe(undefined);
                //done();
            });
        });
    });

    pit("simple update (2)", () => {
        var obj = { a: 1, b: { c: 1 } };
        var store = new MemoryStore();
        var id = store.put(obj);

        var pul = new PUL();
        pul.renameInObject(id, [], "a", "z");
        return store.commitWith(pul).then(() => {
            obj = store.get(id);
            expect(obj["z"]).toBe(1);
            expect(obj.a).toBe(undefined);
        });
    });

    pit("simple update (3)", () => {
        var obj = { a: 1, b: { c: 1 } };
        var store = new MemoryStore();
        var id = store.put(obj);

        var pul = new PUL();
        pul.renameInObject(id, [], "a", "z")
            .insertIntoObject(id, [], { a: 2 });

        return store.commitWith(pul).then(() => {
            obj = store.get(id);
            expect(obj.a).toBe(2);
            expect(obj["z"]).toBe(1);
        });
    });

    pit("simple update (4)", () => {
        var obj = { a: 1, b: { c: 1 } };
        var store = new MemoryStore();
        var id = store.put(obj);

        var pul = new PUL();
        pul.insertIntoObject(id, [], { z: 1 })
            .insertIntoObject(id, [], { a: 2 });

        //throws [JNUP0006] "a": pair to insert already exists in object
        return store.commitWith(pul).catch(e => {
            expect(e instanceof jerr.JNUP0006).toBe(true);
            //"An individual function may create an invalid JSON instance;
            // however, an updating query must produce a valid JSON instance once the entire query is evaluated,
            // or an error is raised and the entire update fails, leaving the instance in its original state."
            obj = store.get(id);
            expect(obj.a).toBe(1);
            expect(obj["z"]).toBe(undefined);
        });
    });

    //http://try.zorba.io/queries/xquery/YLem0q2eDKwF7Yb9GyBKIwdUA20%3D
    //http://try.zorba.io/queries/xquery/J5QX9GgI64MnJlJ3IJ9vCUcCG8o%3D
    pit("example", () => {
        var todos = [{
            id: 0,
            title: "Write thesis",
            complete: false
        }];

        var store = new MemoryStore();
        var id = store.put(todos);
        var pul = new PUL();
        pul
            .insertIntoArray(id, [], 1, [{ id: 1 }])
            .replaceInObject(id, ["0"], "complete", true)
            .renameInObject(id, ["0"], "complete", "completed")
            .insertIntoObject(id, ["0"], { title: "More figures" })
            .deleteFromObject(id, ["0"], ["title"]);
        return store.commitWith(pul).then(() => {
            todos = store.get(id);
            expect(todos[0]["completed"]).toBe(true);
            expect(todos[0].complete).toBe(undefined);
            expect(todos[0].id).toBe(0);
            expect(todos[0].title).toBe("More figures");
            expect(todos[1].id).toBe(1);
        });
    });

    pit("JNUP0008", () => {
        var obj = { a: 1, b: {} };

        var store = new MemoryStore();
        var id = store.put(obj);

        var pul = new PUL();
        pul.insertIntoObject(id, ["c"], { a: 1 });

        return store.commitWith(pul).catch(e => {
            expect(e instanceof jerr.JNUP0008).toBe(true);
        });
    });

    //http://try.zorba.io/queries/xquery/ggGUhCUEuOUaVmfxjTOJ4ygDdas%3D
    pit("rename & insert (1)", () => {
        var obj = { a: 1, b: {} };
        var store = new MemoryStore();
        var id = store.put(obj);
        var pul = new PUL();
        pul
            .insertIntoObject(id, ["b"], { a: 1 })
            .renameInObject(id, [], "b", "z");
        return store.commitWith(pul).then(() => {
            obj = store.get(id);
            expect(obj["z"]["a"]).toBe(1);
        });
    });

    //http://try.zorba.io/queries/xquery/HdaN8mUvpAIlifs1CgBmz8gZhQo=
    pit("rename & insert (2)", () => {
        var obj = { a: 1 };

        var store = new MemoryStore();
        var id = store.put(obj);
        var pul = new PUL();
        pul
            .insertIntoObject(id, [], { a: 1 })
            .renameInObject(id, [], "a", "b")
            .insert("myID", { z: 1 });

        return store.commitWith(pul).then(() => {
            obj = store.get(id);
            expect(obj.a).toBe(1);
            expect(obj["b"]).toBe(1);

            obj = store.get("myID");
            expect(obj["z"]).toBe(1);
        });
    });

    //http://try.zorba.io/queries/xquery/D4xY%2FX8P10C1bTKtz6ZNnVRIwWs%3D
    pit("[JNUP0016] selector cannot be resolved against supplied object", () => {
        var obj = { completed: true };
        var store = new MemoryStore();
        var id = store.put(obj);
        var pul = new PUL();
        pul.renameInObject(id, [], "completed", "complete");
        pul.replaceInObject(id, [], "complete", false);

        return store.commitWith(pul).catch(e => {
            expect(e instanceof jerr.JNUP0016).toBe(true);
        });
    });

    //http://try.zorba.io/queries/xquery/tzcZsn7c8sI82o45LJUo3SgkENM%3D
    pit("[JNUP0006] b: pair to insert already exists in object", () => {
        var d0 = new PUL();
        d0.insertIntoObject("1", [], { a: 1, b: 1 });

        var d1 = new PUL();
        d1.renameInObject("1", [], "a", "b");

        var store = new MemoryStore();
        store.put({}, "1");
        return store.commitWith(d0).then(() => {
            return store.commitWith(d1);
        }).catch(e => {
            expect(e instanceof jerr.JNUP0006).toBe(true);
        });
    });

    it("ReplaceInObject (1)", () => {
        var d0 = new PUL();
        d0.replaceInObject("1", [], "a", { b: 1 });

        var d1 = new PUL();
        d1.renameInObject("1", ["a"], "b", "c");

        var store = new MemoryStore();
        store.put({ a: {} }, "1");
        return store.commitWith(d0).then(() => {
            return store.commitWith(d1);
        }).then(() => {
            expect(_.isEqual(store.snapshot, {
                "1": {
                    "a": {
                        "c": 1
                    }
                }
            })).toBe(true);
        });
    });

    pit("RenameInObject (2)", () => {
        var d0 = new PUL();
        d0.replaceInObject("1", ["a"], "b", { c: 1 });

        var d1 = new PUL();
        d1.renameInObject("1", ["a", "b"], "c", "d");

        var store = new MemoryStore();
        store.put({ a: { b: { c: 1 } } }, "1");
        return store.commitWith(d0).then(() => {
            return store.commitWith(d1);
        }).then(() => {
            expect(store.snapshot).toEqual({
                "1": {
                    "a": {
                        "b": {
                            d: 1
                        }
                    }
                }
            });
        });
    });
});
