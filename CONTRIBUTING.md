## Development

To edit the skills locally, please symlink them:

```sh
mkdir .agents
ln -sn "$(pwd)/local-skills/skills" .agents/skills
```

> [!NOTE] 
> If we commit the .agents folder, any users installing the Contentful skills will end up with only the `.agents/skills` and not the `./skills`

