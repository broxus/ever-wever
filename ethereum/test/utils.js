const chai = require('chai');
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

const { expect } = chai;


module.exports = {
    expect,
};