async function findMaintainer(context) {
  // Get all internal collaborators on the repo
  const collaborators = await context.octokit.repos.listCollaborators({
    ...context.repo(),
    affiliation: "direct",
  });

  // Find first maintainer amongst the collaborators
  let maintainer = collaborators.data.find((col) => col.permissions?.maintain);

  // Use admin if no maintainer
  if (!maintainer) {
    maintainer = collaborators.data.find((col) => col.permissions?.admin);
  }

  return maintainer;
}

async function getCollaboratorPermissions(context, username) {
  const collaboratorPermissions =
    await context.octokit.repos.getCollaboratorPermissionLevel({
      ...context.repo(),
      username,
    });

  return collaboratorPermissions.data.user?.permissions;
}

async function addComment(context, body) {
  const reply = context.issue({ body });

  return await context.octokit.issues.createComment(reply);
}

async function resolveUsernameToEmail(context, username) {
  const user = await context.octokit.users.getByUsername({ username });
  return user.data.email;
}

function extractPayoutCommandArgs(arguments) {
  const args = arguments.split(" ");
  const amountString = args[0].trim().replace("$", "");
  const amount = Number(amountString);

  const username = args[1]?.trim().replace("@", "");

  return { amount, username };
}

async function notifyMaintainerOfPaymentStatus(context, username, amount) {
  const maintainer = await findMaintainer(context);
  
  if (maintainer) {
    const message = `@${maintainer.login}, a payment of $${amount} has been successfully initiated for @${username}.`;
    await addComment(context, message);
  }
}

async function handlePaymentErrors(context, error) {
  const message = `An error occurred during the payout process: ${error.message}`;
  await addComment(context, message);
}

module.exports = {
  getCollaboratorPermissions,
  findMaintainer,
  resolveUsernameToEmail,
  addComment,
  extractPayoutCommandArgs,
  notifyMaintainerOfPaymentStatus,
  handlePaymentErrors,             
};