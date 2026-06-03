import assert from "node:assert";
import { fileURLToPath } from "node:url";
import { RuntimeEnvironment } from "../../runner-api.ts";

const gitIgnoreFixturePath = fileURLToPath(new URL("../../../tests/fixtures/gitignore/", import.meta.url));

export class GitIgnoreTests
{
    async ignoredDirectoriesShouldNotBeLoadedAsTestModules()
    {
        const { AppSpecification } = await RuntimeEnvironment.resolveRuntimeModules();
        const spec = new AppSpecification(gitIgnoreFixturePath);

        await spec.load();

        assert.deepStrictEqual(spec.testSuites.map(suite => suite.className), ["VisibleGitIgnoreFixtureTest"]);
    }
}
