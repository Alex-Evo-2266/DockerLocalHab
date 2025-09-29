#!/bin/bash
set -e

if [ "$#" -lt 2 ]; then
    echo "Использование: $0 <image> <registry> [username] [password]"
    echo "Пример: $0 my-app:latest myregistry.com:5000 user pass"
    exit 1
fi

IMAGE="$1"
REGISTRY="$2"
USERNAME="$3"
PASSWORD="$4"

# Определяем имя нового тега
IMAGE_NAME=$(echo "$IMAGE" | awk -F':' '{print $1}')
IMAGE_TAG=$(echo "$IMAGE" | awk -F':' '{print $2}')
if [ -z "$IMAGE_TAG" ]; then
    IMAGE_TAG="latest"
fi

NEW_IMAGE="$REGISTRY/$IMAGE_NAME:$IMAGE_TAG"

echo "🔖 Тэгируем образ: $IMAGE → $NEW_IMAGE"
docker tag "$IMAGE" "$NEW_IMAGE"

# Логин в registry, если заданы username и password
if [ -n "$USERNAME" ] && [ -n "$PASSWORD" ]; then
    echo "🔐 Логинимся в $REGISTRY"
    echo "$PASSWORD" | docker login "$REGISTRY" -u "$USERNAME" --password-stdin
fi

# Пуш образа
echo "📤 Отправляем $NEW_IMAGE в $REGISTRY"
docker push "$NEW_IMAGE"

echo "✅ Образ успешно добавлен: $NEW_IMAGE"
