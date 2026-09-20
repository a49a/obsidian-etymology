import { describe, expect, it } from "vitest";
import { withTimeout } from "./ai-provider";

describe("withTimeout", () => {
	it("passes the resolved value through", async () => {
		await expect(withTimeout(Promise.resolve("ok"), 5)).resolves.toBe("ok");
	});

	it("passes the underlying rejection through", async () => {
		await expect(withTimeout(Promise.reject(new Error("boom")), 5)).rejects.toThrow("boom");
	});

	it("rejects with a timeout error when the promise never settles", async () => {
		const error = await withTimeout(new Promise<string>(() => {}), 0.01).then(
			() => null,
			(e: unknown) => e
		);
		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toContain("timed out");
	});

	it("never times out when disabled with 0", async () => {
		let resolveLater!: (value: string) => void;
		const promise = new Promise<string>((resolve) => {
			resolveLater = resolve;
		});
		const wrapped = withTimeout(promise, 0);
		setTimeout(() => resolveLater("late"), 20);
		await expect(wrapped).resolves.toBe("late");
	});
});
