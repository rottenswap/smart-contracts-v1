const { expectRevert } = require('@openzeppelin/test-helpers');
const RottenToken = artifacts.require('RottenToken');
const MaggotToken = artifacts.require('MaggotToken');

const getBalances = async () => {
    const maggot = {}
    maggot.supply = (await this.maggot.totalSupply()).toString()
    for (const i in this.addresses) {
        maggot[i] = (await this.maggot.balanceOf(this.addresses[i])).toString()
    }
    const sushi = {}
    sushi.supply = (await this.sushi.totalSupply()).toString()
    for (const i in this.addresses) {
        sushi[i] = (await this.sushi.balanceOf(this.addresses[i])).toString()
    }
    return {maggot, sushi}
}

const getNumberWithManyZeroes = (amountOfZeroes) => {
    assert(typeof amountOfZeroes === 'number')
    let numberWithManyZeroes = '1'
    while (amountOfZeroes--) {
        numberWithManyZeroes += '0'
    }
    return numberWithManyZeroes
}

contract('MaggotToken', ([alice, bob, carol, res]) => {
    beforeEach(async () => {
        this.addresses = {alice, bob, carol, res}
        this.maggot = await MaggotToken.new(res, { from: alice });
        const maggotDivisor = 100
        this.sushi = await RottenToken.new(this.maggot.address, maggotDivisor, { from: alice });
        await this.maggot.transferOwnership(this.sushi.address, { from: alice })
    });

    it('should have correct name and symbol and decimal', async () => {
        const name = await this.maggot.name();
        const symbol = await this.maggot.symbol();
        const decimals = await this.maggot.decimals();
        assert.equal(name.toString(), 'MaggotToken');
        assert.equal(symbol.toString(), 'MAGGOT');
        assert.equal(decimals.toString(), '18');

        assert(!this.maggot.transferRes)
        await this.maggot.setRes(alice, {from: res});
        await expectRevert(
            this.maggot.setRes(res, {from: res}),
            'Maggot: setRes invalid signer'
        );
        await this.maggot.setRes(res, {from: alice});
        await expectRevert(
            this.maggot.setRes(alice, {from: alice}),
            'Maggot: setRes invalid signer'
        );
    });

    describe('transfer should work with small amounts', async () => {
        beforeEach(async () => {
            await this.sushi.mint(alice, '10000', { from: alice });
            await this.sushi.mint(bob, '10000', { from: alice });
        });
        let balances
        it('should work with 0', async () => {
            await this.sushi.transfer(carol, '0', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      10000)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    0)
            assert.equal(balances.maggot.carol,   0)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     0)
            assert.equal(balances.sushi.supply,   20000)
            assert.equal(balances.maggot.supply,  0)
        })
        it('should work with 1', async () => {
            await this.sushi.transfer(carol, '1', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      9999)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    1)
            assert.equal(balances.maggot.carol,   0)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     0)
            assert.equal(balances.sushi.supply,   20000)
            assert.equal(balances.maggot.supply,  0)
        })
        it('should work with 10', async () => {
            await this.sushi.transfer(carol, '10', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      9990)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    10)
            assert.equal(balances.maggot.carol,   0)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     0)
            assert.equal(balances.sushi.supply,   20000)
            assert.equal(balances.maggot.supply,  0)
        })
        it('should work with 100', async () => {
            await this.sushi.transfer(carol, '100', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      9900)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    99)
            assert.equal(balances.maggot.carol,   1)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     0)
            assert.equal(balances.sushi.supply,   19999)
            assert.equal(balances.maggot.supply,  1)
        })
        it('should work with 1000', async () => {
            await this.sushi.transfer(carol, '1000', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      9000)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    990)
            assert.equal(balances.maggot.carol,   10)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     0)
            assert.equal(balances.sushi.supply,   19990)
            assert.equal(balances.maggot.supply,  10)
        })
        it('should work with 10000', async () => {
            await this.sushi.transfer(carol, '10000', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      0)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    9900)
            assert.equal(balances.maggot.carol,   100)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     1)
            assert.equal(balances.sushi.supply,   19900)
            assert.equal(balances.maggot.supply,  101)
        })
        it('should not work with -1', async () => {
            await expectRevert.unspecified(
                this.sushi.transfer(carol, '-1', { from: bob })
            );
        })
        it('transfer should not work with -1000000000000000000000000000000000000000000', async () => {
            await expectRevert.unspecified(
                this.sushi.transfer(carol, '-1000000000000000000000000000000000000000000', { from: bob })
            );
        })
    });

    describe('transferFrom should work with small amounts', async () => {
        beforeEach(async () => {
            await this.sushi.mint(alice, '10000', { from: alice });
            await this.sushi.mint(bob, '10000', { from: alice });
            await this.sushi.approve(bob, '10000', { from: bob });
        });
        let balances
        it('should work with 0', async () => {
            await this.sushi.transferFrom(bob, carol, '0', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      10000)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    0)
            assert.equal(balances.maggot.carol,   0)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     0)
            assert.equal(balances.sushi.supply,   20000)
            assert.equal(balances.maggot.supply,  0)
        })
        it('should work with 1', async () => {
            await this.sushi.transferFrom(bob, carol, '1', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      9999)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    1)
            assert.equal(balances.maggot.carol,   0)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     0)
            assert.equal(balances.sushi.supply,   20000)
            assert.equal(balances.maggot.supply,  0)
        })
        it('should work with 10', async () => {
            await this.sushi.transferFrom(bob, carol, '10', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      9990)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    10)
            assert.equal(balances.maggot.carol,   0)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     0)
            assert.equal(balances.sushi.supply,   20000)
            assert.equal(balances.maggot.supply,  0)
        })
        it('should work with 100', async () => {
            await this.sushi.transferFrom(bob, carol, '100', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      9900)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    99)
            assert.equal(balances.maggot.carol,   1)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     0)
            assert.equal(balances.sushi.supply,   19999)
            assert.equal(balances.maggot.supply,  1)
        })
        it('should work with 1000', async () => {
            await this.sushi.transferFrom(bob, carol, '1000', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      9000)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    990)
            assert.equal(balances.maggot.carol,   10)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     0)
            assert.equal(balances.sushi.supply,   19990)
            assert.equal(balances.maggot.supply,  10)
        })
        it('should work with 10000', async () => {
            await this.sushi.transferFrom(bob, carol, '10000', { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      0)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    9900)
            assert.equal(balances.maggot.carol,   100)
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     1)
            assert.equal(balances.sushi.supply,   19900)
            assert.equal(balances.maggot.supply,  101)
        })
        it('should not work with -1', async () => {
            await expectRevert.unspecified(
                this.sushi.transferFrom(bob, carol, '-1', { from: bob })
            );
        })
        it('transfer should not work with -1000000000000000000000000000000000000000000', async () => {
            await expectRevert.unspecified(
                this.sushi.transferFrom(bob, carol, '-1000000000000000000000000000000000000000000', { from: bob })
            );
        })
    })

    describe('transfer should work with big amounts', async () => {
        beforeEach(async () => {
            await this.sushi.mint(alice, getNumberWithManyZeroes(75), { from: alice });
            await this.sushi.mint(bob, getNumberWithManyZeroes(75), { from: alice });
        });
        let balances
        it(`should work with ${getNumberWithManyZeroes(60)}`, async () => {
            await this.sushi.transfer(carol, getNumberWithManyZeroes(60), { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      '999999999999999000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    '990000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.carol,   '10000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     '100000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.supply,   '1999999999999999990000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.supply,  '10100000000000000000000000000000000000000000000000000000000')
        })
        it(`should work with ${getNumberWithManyZeroes(70)}`, async () => {
            await this.sushi.transfer(carol, getNumberWithManyZeroes(70), { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      '999990000000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    '9900000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.carol,   '100000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.res,      '0')
            assert.equal(balances.maggot.res,     '1000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.supply,   '1999999900000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.supply,  '101000000000000000000000000000000000000000000000000000000000000000000')
        })
        it(`should work with ${getNumberWithManyZeroes(75)}`, async () => {
            await this.sushi.transfer(carol, getNumberWithManyZeroes(75), { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      0)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    '990000000000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.carol,   '10000000000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     '100000000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.supply,   '1990000000000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.supply,  '10100000000000000000000000000000000000000000000000000000000000000000000000')
        })
        it('should not work with balance exceeded', async () => {
            await expectRevert.unspecified(
                this.sushi.transfer(carol, getNumberWithManyZeroes(74) + '1', { from: bob })
            );
            await expectRevert.unspecified(
                this.sushi.transfer(carol, getNumberWithManyZeroes(76), { from: bob })
            );
            await expectRevert.unspecified(
                this.sushi.transfer(carol, getNumberWithManyZeroes(80), { from: bob })
            );
            await expectRevert.unspecified(
                this.sushi.transfer(carol, getNumberWithManyZeroes(100), { from: bob })
            );
            await expectRevert.unspecified(
                this.sushi.transfer(carol, getNumberWithManyZeroes(200), { from: bob })
            );
        })
    })

    describe('transferFrom should work with big amounts', async () => {
        beforeEach(async () => {
            await this.sushi.mint(alice, getNumberWithManyZeroes(75), { from: alice });
            await this.sushi.mint(bob, getNumberWithManyZeroes(75), { from: alice });
            await this.sushi.approve(bob, getNumberWithManyZeroes(75), { from: bob });
        });
        let balances
        it(`should work with ${getNumberWithManyZeroes(60)}`, async () => {
            await this.sushi.transferFrom(bob, carol, getNumberWithManyZeroes(60), { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      '999999999999999000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    '990000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.carol,   '10000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     '100000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.supply,   '1999999999999999990000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.supply,  '10100000000000000000000000000000000000000000000000000000000')
        })
        it(`should work with ${getNumberWithManyZeroes(70)}`, async () => {
            await this.sushi.transferFrom(bob, carol, getNumberWithManyZeroes(70), { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      '999990000000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    '9900000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.carol,   '100000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.res,      '0')
            assert.equal(balances.maggot.res,     '1000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.supply,   '1999999900000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.supply,  '101000000000000000000000000000000000000000000000000000000000000000000')
        })
        it(`should work with ${getNumberWithManyZeroes(75)}`, async () => {
            await this.sushi.transferFrom(bob, carol, getNumberWithManyZeroes(75), { from: bob });
            balances = await getBalances()
            assert.equal(balances.sushi.bob,      0)
            assert.equal(balances.maggot.bob,     0)
            assert.equal(balances.sushi.carol,    '990000000000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.carol,   '10000000000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.res,      0)
            assert.equal(balances.maggot.res,     '100000000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.sushi.supply,   '1990000000000000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(balances.maggot.supply,  '10100000000000000000000000000000000000000000000000000000000000000000000000')
        })
        it('should not work with balance exceeded', async () => {
            await expectRevert.unspecified(
                this.sushi.transferFrom(bob, carol, getNumberWithManyZeroes(74) + '1', { from: bob })
            );
            await expectRevert.unspecified(
                this.sushi.transferFrom(bob, carol, getNumberWithManyZeroes(76), { from: bob })
            );
            await expectRevert.unspecified(
                this.sushi.transferFrom(bob, carol, getNumberWithManyZeroes(80), { from: bob })
            );
            await expectRevert.unspecified(
                this.sushi.transferFrom(bob, carol, getNumberWithManyZeroes(100), { from: bob })
            );
            await expectRevert.unspecified(
                this.sushi.transferFrom(bob, carol, getNumberWithManyZeroes(200), { from: bob })
            );
        })
    })
});
