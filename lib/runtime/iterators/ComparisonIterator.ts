/// <reference path="../../../typings/tsd.d.ts" />
import Iterator from "./Iterator";
import Position from "../../compiler/parsers/Position";
import * as SourceMap from "source-map";

export default class ComparisonIterator extends Iterator {

    private operator: string;
    private left: Iterator;
    private right: Iterator;

    constructor(position: Position, left: Iterator, right: Iterator, operator: string) {
        super(position);
        this.left = left;
        this.right = right;
        this.operator = operator;
    }

    serialize(): SourceMap.SourceNode {
        var node = super.serialize();
        node
            .add("r.comp(")
            .add(this.left.serialize())
            .add(", ")
            .add(this.right.serialize())
            .add(", ")
            .add(JSON.stringify(this.operator))
            .add(")");
        return node;
    }
}
