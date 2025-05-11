CONTAINER_NAME="garage_test_multidisk_garage-1_1"

ZONE_NAME="dc1"
CAPACITY="30G"

ZONE_NAME="dc1"
CAPACITY="30G"

NODE_INFO=$(docker exec "$CONTAINER_NAME" /garage node id | head -n 1)
NODE_ID=$(echo "$NODE_INFO" | cut -d'@' -f1)

USER=fbatard

BUCKET=test

if [ -z "$NODE_ID" ]; then
  echo "❌ Impossible de récupérer l'ID du nœud."
  exit 1
fi

echo "🆔 Node ID récupéré: $NODE_ID"

echo "⚙️ Assignation du nœud au cluster avec zone '$ZONE_NAME' et capacité '$CAPACITY'..."
docker exec "$CONTAINER_NAME" /garage layout assign -z "$ZONE_NAME" -c "$CAPACITY" "$NODE_ID"

if [ $? -eq 0 ]; then
  echo "✅ Assignation réussie !"
else
  echo "❌ Échec de l'assignation."
  exit 2
fi

echo "⚙️ Application du layer..."
docker exec "$CONTAINER_NAME" /garage layout apply --version 1

# Optionnel : afficher le layout actuel
echo "📊 Layout actuel :"
docker exec "$CONTAINER_NAME" /garage layout show