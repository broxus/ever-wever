import {setupWever, expect} from "./utils";
import {toNano} from "locklift";


const EMPTY_TVM_CELL = "te6ccgEBAQEAAgAAAA==";


describe('Test Vault emergency mode', async function() {
    this.timeout(200000);

    // @ts-ignore
    let context: ReturnType<typeof setupWever> extends Promise<infer F> ? F : never = {};

    it("Setup contracts", async function () {
        await locklift.deployments.fixture();

        context = await setupWever();
    });

    it('Enable emergency mode with guardian', async () => {
        const {
            account: guardian
        } = await locklift.deployments.getAccount('Guardian');

        await context.vault.methods.setEmergency({
            _emergency: true
        }).send({
            from: guardian.address,
            amount: toNano('1')
        });
    });

    it('Check emergency mode enabled', async () => {
        const {
            emergency
        } = await context.vault.methods.emergency().call();

        expect(emergency)
            .to.be.equal(true, 'Emergency mode should be enabled');
    });

    it('Try to wrap EVER', async () => {
        const trace = await locklift.tracing.trace(
            context.vault.methods.wrap({
                tokens: toNano(1),
                owner_address: context.user.address,
                gas_back_address: context.user.address,
                payload: EMPTY_TVM_CELL
            }).send({
                from: context.user.address,
                amount: toNano(3)
            }),
            {
                raise: false
            }
        );

        await trace.traceTree?.beautyPrint();

        expect(trace.traceTree)
            .to.have.error(107, 'Wrap should be reverted');
    });

    it('Try to unwrap wEVER', async () => {

    });

    it('Try to grant EVER', async () => {
        // const trace = await locklift.tracing.trace(
        //     context.vault.methods.grant({
        //         amount: toNano(1)
        //     }).send({
        //         from: context.user.address,
        //         amount: toNano(3)
        //     }),
        //     {
        //         raise: false
        //     }
        // );
        //
        // await trace.traceTree.beautyPrint();
        //
        // expect(trace.traceTree).to.have.error(107, 'Grant should be reverted');
    });

    it('Try to disable emergency mode with guardian', async () => {

    });

    it('Disable emergency mode with owner', async () => {

    });
});
