const { expectRevert } = require('@openzeppelin/test-helpers');
const RottenToken = artifacts.require('RottenToken');
const MaggotToken = artifacts.require('MaggotToken');

contract('RottenToken', ([alice, bob, carol, res]) => {
    beforeEach(async () => {
        this.maggot = await MaggotToken.new(res, { from: alice });
        const maggotDivisor = 100
        this.sushi = await RottenToken.new(this.maggot.address, maggotDivisor, { from: alice });
        await this.maggot.transferOwnership(this.sushi.address, { from: alice })
    });

    it('should have correct name and symbol and decimal', async () => {
        const name = await this.sushi.name();
        const symbol = await this.sushi.symbol();
        const decimals = await this.sushi.decimals();
        assert.equal(name.toString(), 'RottenToken');
        assert.equal(symbol.toString(), 'ROT');
        assert.equal(decimals.toString(), '18');
    });

    it('should only allow owner to mint token', async () => {
        await this.sushi.mint(alice, '100', { from: alice });
        await this.sushi.mint(bob, '1000', { from: alice });
        await expectRevert(
            this.sushi.mint(carol, '1000', { from: bob }),
            'Ownable: caller is not the owner',
        );
        const totalSupply = await this.sushi.totalSupply();
        const aliceBal = await this.sushi.balanceOf(alice);
        const bobBal = await this.sushi.balanceOf(bob);
        const carolBal = await this.sushi.balanceOf(carol);
        assert.equal(totalSupply.toString(), '1100');
        assert.equal(aliceBal.toString(), '100');
        assert.equal(bobBal.toString(), '1000');
        assert.equal(carolBal.toString(), '0');
    });

    it('should supply token transfers properly', async () => {
        await this.sushi.mint(alice, '10000', { from: alice });
        await this.sushi.mint(bob, '10000', { from: alice });
        await this.sushi.transfer(carol, '1000', { from: alice });
        await this.sushi.transfer(carol, '10000', { from: bob });
        const totalSupply = await this.sushi.totalSupply();
        const aliceBal = await this.sushi.balanceOf(alice);
        const bobBal = await this.sushi.balanceOf(bob);
        const carolBal = await this.sushi.balanceOf(carol);
        // total balance includes maggot burn
        assert.equal(totalSupply.toString(), 20000 - (10 + 100));
        assert.equal(aliceBal.toString(), '9000');
        assert.equal(bobBal.toString(), '0');
        // recipient balance includes maggot burn
        assert.equal(carolBal.toString(), 990 + 9900);

        const maggotSupply = await this.maggot.totalSupply();
        const aliceMaggotBal = await this.maggot.balanceOf(alice);
        const bobMaggotBal = await this.maggot.balanceOf(bob);
        const carolMaggotBal = await this.maggot.balanceOf(carol);
        const resMaggotBal = await this.maggot.balanceOf(res);
        assert.equal(maggotSupply.toString(), 10 + 100 + 1);
        assert.equal(aliceMaggotBal.toString(), '0');
        assert.equal(bobMaggotBal.toString(), '0');
        assert.equal(carolMaggotBal.toString(), 10 + 100);
        assert.equal(resMaggotBal.toString(), 1);
    });

    it('should fail if you try to do bad transfers', async () => {
        await this.sushi.mint(alice, '100', { from: alice });
        await expectRevert(
            this.sushi.transfer(carol, '110', { from: alice }),
            'ERC20: transfer amount exceeds balance',
        );
        await expectRevert(
            this.sushi.transfer(carol, '1', { from: bob }),
            'ERC20: transfer amount exceeds balance',
        );
    });
  });
