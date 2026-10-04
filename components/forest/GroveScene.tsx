"use client";

import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/Icon";
import { xpRequiredForLevel } from "@/core/engine/levels";
import { STAT_KEYS, type StatKey } from "@/core/types";
import { treeStageNameForLevel } from "./growth";
import type { GardenState } from "./garden-model";

const GroveCanvas = dynamic(() => import("./GroveCanvas"), { ssr: false, loading: () => <div className="grove-loading" role="status">Finding a little quiet…</div> });

export function GroveScene(props: GardenState & { xp: Record<StatKey, number>; visible: boolean }) {
  return <div className="grove-scene" role="group" aria-label="Your growing grove">
    <p className="grove-caption">Your growing grove<span/></p>
    <GroveCanvas levels={props.levels} neglect={props.neglect} danger={props.danger} streak={props.streak} visible={props.visible}/>
    <div className="grove-labels">
      {STAT_KEYS.map((stat) => {
        const level = props.levels[stat], xp = Math.max(0, props.xp[stat]);
        const floor = xpRequiredForLevel(level), ceil = xpRequiredForLevel(level + 1);
        const progress = Math.min(1, Math.max(0, (xp - floor) / Math.max(1, ceil - floor)));
        return <div key={stat} className={`tree-label tree-label-${stat} ${level < 3 ? "is-small-tree" : ""} ${props.neglect[stat] ? "is-wilting" : ""}`} style={{ "--task-color": `var(--stat-${stat})` } as React.CSSProperties}>
          <Icon name={stat} size={23}/>
          <div><p><span className="capitalize">{stat}</span><span> · Lv {level}</span></p>
            <div className="tree-xp" role="progressbar" aria-label={`${stat} level progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span style={{ width: `${progress * 100}%` }}/></div>
            <small>{treeStageNameForLevel(level)} · {Math.round(xp - floor).toLocaleString("en-US")} / {Math.round(ceil - floor).toLocaleString("en-US")} XP</small>
            {props.neglect[stat] && <small className="tree-warning">Needs care · XP at risk</small>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}
