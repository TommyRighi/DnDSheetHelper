export function parseDiceFormula(input) {
  if (typeof input !== "string" || input.length > 120)
    throw new Error("Formula troppo lunga.");
  const expression = input.toLowerCase().replace(/\s+/g, "");
  if (
    !expression ||
    !/^(?:\d*d\d+|[+-]?\d+)(?:[+-](?:\d*d\d+|\d+))*$/.test(expression)
  )
    throw new Error("Usa una formula come 2d6+1d8+3.");
  const tokens = expression.match(/[+-]?[^+-]+/g);
  const groups = [];
  let bonus = 0;
  for (const token of tokens) {
    if (token.includes("d")) {
      if (token.startsWith("-"))
        throw new Error("I gruppi di dadi devono essere positivi.");
      const [countText, sidesText] = token.replace(/^\+/, "").split("d");
      const count = Number(countText || 1),
        sides = Number(sidesText);
      if (
        !Number.isInteger(count) ||
        count < 1 ||
        ![4, 6, 8, 10, 12, 20, 100].includes(sides)
      )
        throw new Error(
          "Usa dadi d4, d6, d8, d10, d12, d20 o d100, con quantità intere positive.",
        );
      groups.push({ count, sides });
    } else bonus += Number(token);
  }
  const count = groups.reduce((sum, g) => sum + g.count, 0);
  if (
    !count ||
    count > 100 ||
    !Number.isSafeInteger(bonus) ||
    Math.abs(bonus) > 999
  )
    throw new Error(
      "Massimo 100 dadi e modificatore complessivo tra -999 e +999.",
    );
  return { expression, groups, bonus };
}
export function rollFormula(input, randomDie) {
  const parsed = parseDiceFormula(input);
  const values = parsed.groups.flatMap((g) =>
    Array.from({ length: g.count }, () => randomDie(g.sides)),
  );
  return {
    ...parsed,
    values,
    sides: parsed.groups.length === 1 ? parsed.groups[0].sides : 0,
    total: values.reduce((a, b) => a + b, 0) + parsed.bonus,
  };
}
