module.exports = {
    check: (member, permission) => {
        return member.permissions.has(permission);
    }
};