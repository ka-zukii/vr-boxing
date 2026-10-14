import * as THREE from "three";
import { getDifficultySettings } from "./targetLogic.js";

const SPEED_WINDOW = 0.12;
const HAND_IGNORE_SPEED = 0.55;
const PUNCH_COOLDOWN = 0.2;
const SCORE_INTERVAL_MS = 200;
const HIT_RADIUS = 0.5 * 0.48 + 0.12;
const DESKTOP_PUNCH_REACH = 1.2;

export function detectPunch(controller, hand, delta, game) {
  if (game.state !== "PLAYING" || game.pendingGameOverTimer > 0) return false;

  const previousPosition =
    hand === "left"
      ? game.controllers.previousLeftPosition
      : game.controllers.previousRightPosition;
  const samples =
    hand === "left" ? game.leftMotionSamples : game.rightMotionSamples;
  const motion = sampleHandMotion(controller, previousPosition, samples, delta);
  const speed = Math.max(motion.instantSpeed, motion.windowSpeed);
  const armedKey = hand === "left" ? "leftHitArmed" : "rightHitArmed";

  if (game[armedKey] === false) {
    if (
      motion.to.distanceTo(game.target.position) > 0.55 &&
      speed < HAND_IGNORE_SPEED
    ) {
      game[armedKey] = true;
    } else {
      return false;
    }
  }

  if (hand === "left") game.leftHandSpeed = motion.windowSpeed;
  else game.rightHandSpeed = motion.windowSpeed;

  const cooldownKey =
    hand === "left" ? "leftPunchCooldown" : "rightPunchCooldown";
  if (game[cooldownKey] > 0) {
    game[cooldownKey] = Math.max(0, game[cooldownKey] - delta);
    return false;
  }
  if (speed < HAND_IGNORE_SPEED) return false;

  const settings = getDifficultySettings(game);
  if (speed < settings.minPunchSpeed) {
    if (game.mode === "SINGLE") game.triggerHaptic?.(hand, 0.12, 40);
    game.status = `TOO SLOW  ${speed.toFixed(1)} m/s`;
    game.feedbackTimer = 0.9;
    game[cooldownKey] = PUNCH_COOLDOWN;
    return false;
  }

  game.onPunch?.(hand);
  game[cooldownKey] = PUNCH_COOLDOWN;
  return checkHit(controller, game, motion, speed, hand);
}

export function checkHit(
  controller,
  game,
  motion = game.latestMotion,
  speed = game.latestPunchSpeed,
  hand = game.latestPunchHand,
) {
  if (!motion || !Number.isFinite(speed)) return false;
  game.latestMotion = motion;
  game.latestPunchSpeed = speed;
  game.latestPunchHand = hand;

  const box = game.getTargetHitbox();
  const hitPoint =
    !box.isEmpty() &&
    (box.containsPoint(motion.from) || box.containsPoint(motion.to));
  const segmentDistance = distancePointToSegment(
    game.target.position,
    motion.from,
    motion.to,
  );
  const isHit = hitPoint || segmentDistance <= HIT_RADIUS;
  const closestDistance = Math.min(
    motion.from.distanceTo(game.target.position),
    motion.to.distanceTo(game.target.position),
    segmentDistance,
  );

  if (isHit) {
    const armedKey = hand === "left" ? "leftHitArmed" : "rightHitArmed";

    // PERBAIKAN 1: Abaikan syarat armedKey jika menggunakan Desktop Controls
    if (!game.desktopActive && game[armedKey] === false) return false;
    game[armedKey] = false;

    const now = performance.now();

    // PERBAIKAN 2: Abaikan pembatasan jeda SCORE_INTERVAL_MS untuk Desktop Controls
    if (
      !game.desktopActive &&
      now - (game.lastScoredAt ?? -Infinity) < SCORE_INTERVAL_MS
    ) {
      game[hand === "left" ? "leftPunchCooldown" : "rightPunchCooldown"] =
        PUNCH_COOLDOWN;
      return false;
    }
    game.lastScoredAt = now;

    const settings = getDifficultySettings(game);
    const isPerfect = speed >= settings.perfectSpeed && closestDistance <= 0.13;
    game.hits += 1;
    if (isPerfect) game.perfects += 1;

    const points = 10;
    const fist =
      hand === "left" ? game.controllers.leftFist : game.controllers.rightFist;
    fist.scale.setScalar(1.3);

    if (game.mode === "SINGLE") {
      game.flashTarget?.(isPerfect);
      game.triggerHaptic?.(hand, isPerfect ? 0.95 : 0.58, isPerfect ? 180 : 90);
      if (isPerfect) game.triggerSlowMotion?.();
      game.combatFeedback?.show(
        isPerfect ? "PERFECT!" : "HIT\n+10",
        isPerfect ? "perfect" : "hit",
      );
      game.audio.play(isPerfect ? "perfect" : "hit", isPerfect ? 0.8 : 0.65);
      game.addScore(points);
      game.updateCombo(true);
      if (game.combo >= 2)
        game.combatFeedback?.show(`COMBO x${game.combo}`, "combo");
      game.onTargetHit?.();
    } else {
      game.flashTarget?.(isPerfect);
      game.triggerHaptic?.(hand, isPerfect ? 0.95 : 0.58, isPerfect ? 180 : 90);
      const feedbackAnchor = game.getCombatFeedbackAnchor?.();
      game.combatFeedback?.show(
        isPerfect ? "PERFECT!" : "HIT\n+10",
        isPerfect ? "perfect" : "hit",
        feedbackAnchor,
      );
      game.audio.play(isPerfect ? "perfect" : "hit", isPerfect ? 0.8 : 0.65);
      game.addScore(points);
      game.updateCombo(true);
      if (game.combo >= 2)
        game.combatFeedback?.show(
          `COMBO x${game.combo}`,
          "combo",
          feedbackAnchor,
        );
      game.onPunchResult?.(hand, isPerfect ? "PERFECT" : "HIT");
    }
    game.status = isPerfect ? `PERFECT +${points}` : `HIT +${points}`;
    game.feedbackTimer = 0.9;
    return true;
  }

  if (!isTargetedSwing(motion, game)) return false;

  if (game.mode === "SINGLE") {
    game[hand === "left" ? "leftHitArmed" : "rightHitArmed"] = false;
  }

  game[hand === "left" ? "leftPunchCooldown" : "rightPunchCooldown"] =
    PUNCH_COOLDOWN;

  if (game.mode === "SINGLE" && game.onMiss) {
    game.onMiss(hand, "swing");
  } else {
    game.misses += 1;
    game.updateCombo(false);
    game.triggerHaptic?.(hand, 0.24, 55);
    game.combatFeedback?.show(
      `MISS ${game.misses}`,
      "miss",
      game.getCombatFeedbackAnchor?.(),
    );
    game.audio.play("miss", 0.45);
    game.status = `MISS  ${speed.toFixed(1)} m/s`;
    game.feedbackTimer = 0.9;
    game.onPunchResult?.(hand, "MISS");
  }
  return false;
}

function sampleHandMotion(controller, previousPosition, samples, delta) {
  const currentPosition = new THREE.Vector3();
  controller.getWorldPosition(currentPosition);
  const from = previousPosition.clone();
  const distance = from.distanceTo(currentPosition);
  const instantSpeed = distance / Math.max(delta, 0.001);
  previousPosition.copy(currentPosition);

  const now = performance.now();
  samples.push({ position: currentPosition.clone(), time: now });
  const cutoff = now - SPEED_WINDOW * 1000;
  while (samples.length > 1 && samples[0].time < cutoff) samples.shift();

  let windowSpeed = instantSpeed;
  if (samples.length >= 2) {
    const first = samples[0];
    const elapsed = Math.max((now - first.time) / 1000, 0.001);
    windowSpeed = first.position.distanceTo(currentPosition) / elapsed;
  }
  return { from, to: currentPosition, instantSpeed, windowSpeed };
}

function isTargetedSwing(motion, game) {
  const punchDirection = motion.to.clone().sub(motion.from).normalize();
  const targetDirection = game.target.position
    .clone()
    .sub(motion.from)
    .normalize();
  const segmentDistance = distancePointToSegment(
    game.target.position,
    motion.from,
    motion.to,
  );
  return punchDirection.dot(targetDirection) >= 0.45 && segmentDistance <= 1.0;
}

function distancePointToSegment(point, start, end) {
  const segment = new THREE.Vector3().subVectors(end, start);
  const lengthSq = segment.lengthSq();
  if (lengthSq < 0.000001) return point.distanceTo(start);
  const toPoint = new THREE.Vector3().subVectors(point, start);
  const t = THREE.MathUtils.clamp(toPoint.dot(segment) / lengthSq, 0, 1);
  const closest = start.clone().add(segment.multiplyScalar(t));
  return point.distanceTo(closest);
}

export function triggerDesktopPunch(hand, game) {
  if (game.state !== "PLAYING" || game.pendingGameOverTimer > 0) return false;

  const cooldownKey =
    hand === "left" ? "leftPunchCooldown" : "rightPunchCooldown";
  const armedKey = hand === "left" ? "leftHitArmed" : "rightHitArmed";
  const lastPunchKey =
    hand === "left" ? "leftDesktopPunchAt" : "rightDesktopPunchAt";

  // Cooldown berbasis waktu, tidak bergantung pada detectPunch
  const now = performance.now();
  if (now - (game[lastPunchKey] ?? -Infinity) < PUNCH_COOLDOWN * 1000) {
    return false;
  }
  game[lastPunchKey] = now;

  game[armedKey] = true;

  const simulatedSpeed = 3.5;
  if (hand === "left") game.leftHandSpeed = simulatedSpeed;
  else game.rightHandSpeed = simulatedSpeed;

  const from = game.playerAnchor.clone();
  const targetCenter = new THREE.Vector3();
  const box = game.getTargetHitbox();

  let distanceToTarget;
  if (box && !box.isEmpty()) {
    box.getCenter(targetCenter);
    distanceToTarget = box.distanceToPoint(from); // jarak ke permukaan hitbox
  } else if (game.mode === "MULTI" && game.opponentPlayer) {
    targetCenter.copy(game.opponentPlayer.position);
    targetCenter.y += 1.15;
    distanceToTarget = from.distanceTo(targetCenter);
  } else {
    targetCenter.copy(game.target.position);
    distanceToTarget = from.distanceTo(targetCenter);
  }

  game.onPunch?.(hand); // animasi + kirim aksi tetap jalan

  // Terlalu jauh: pukulan hanya mengenai udara
  if (distanceToTarget > DESKTOP_PUNCH_REACH) {
    game[cooldownKey] = 0;
    game[armedKey] = true;
    return false;
  }

  const direction = targetCenter.clone().sub(from).normalize();
  const to = from
    .clone()
    .add(direction.multiplyScalar(DESKTOP_PUNCH_REACH + 0.3));

  const motion = {
    from,
    to,
    instantSpeed: simulatedSpeed,
    windowSpeed: simulatedSpeed,
  };

  const hitResult = checkHit(null, game, motion, simulatedSpeed, hand);

  return hitResult;
}
