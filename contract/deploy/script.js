module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const deployment = await deploy("MindCastRegistry", {
    from: deployer,
    args:[],
    log: true,
  });


  log(`Contract Address : ${deployment.address}`);

};

module.exports.tags = ["MindCastRegistry"];