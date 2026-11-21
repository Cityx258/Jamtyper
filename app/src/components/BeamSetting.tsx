"use client";

import { useSyncExternalStore } from "react";
import type { Dict } from "@/i18n/en";
import { beamOn, setBeam, subscribeBeam } from "@/lib/beam";
import { Row, Switch } from "@/components/SoundSettings";

export default function BeamSetting({ t, sound }: { t: Dict["settings"]["display"]; sound: Dict["settings"]["sound"] }) {
  const on = useSyncExternalStore(subscribeBeam, beamOn, () => true);
  return (
    <Row label={t.beam} hint={t.beamHint}>
      <Switch on={on} onChange={setBeam} label={t.beam} t={sound} />
    </Row>
  );
}
